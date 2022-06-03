<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\SeafileIntegrator;

use GuzzleHttp\Client;
use GuzzleHttp\Psr7\StreamWrapper;

/**
 * Adds ability to work with Seafile storage inside Aurora Mail module.
 *
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2022, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	/**
	 * Initializes Module.
	 *
	 * @ignore
	 */
	public function init()
	{
		$oSettings = $this->GetModuleSettings();
		$token = $oSettings->GetValue('Token', '');
		if (!empty($token)) {
			setcookie('seahub_token', $token);
		}
		$sessionid = $oSettings->GetValue('SessionId', '');
		if (!empty($sessionid)) {
			setcookie('sessionid', $sessionid);
		}
	}

	/**
	 * Obtains list of module settings for authenticated user.
	 *
	 * @return array
	 */
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		$oSettings = $this->GetModuleSettings();
		return [
			'SeafileHost' => $oSettings->GetValue('SeafileHost', ''),
			'SeafileApiHost' => $oSettings->GetValue('SeafileApiHost', ''),
		];
	}

	public function GetSeafileResponse($Url, $Headers, $PostData = false)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$client = new Client();

		if (is_array($PostData)) {
			$multipart = [];
			foreach ($PostData as $key => $value) {
				$multipart[] = [
					'name' => $key,
					'contents' => $value,
				];
			}
			try {
				$res = $client->post($Url, [
					'headers' => $Headers,
					'multipart' => $multipart,
				]);
			} catch (\Exception $e) {
				$response = $e->getResponse();
				return $response->getBody()->getContents();
			}
		} else {
			try {
				$res = $client->get($Url, [
					'headers' => $Headers,
				]);
			} catch (\Exception $e) {
				$response = $e->getResponse();
				return $response->getBody()->getContents();
			}
		}
		if ($res->getStatusCode() === 200 || $res->getStatusCode() === 201) {
			$resource = $res->getBody();
			return $resource->read($resource->getSize());
		}
		return '';
	}

	public function SaveAttachmentsToSeafile($UserId, $AccountID, $Attachments, $UploadLink, $Headers, $ParentDir = '/')
	{
		$result = false;
		$mailModuleDecorator = \Aurora\Modules\Mail\Module::Decorator();
		if (!$mailModuleDecorator) {
			return false;
		}

		$tempFiles = $mailModuleDecorator->SaveAttachmentsAsTempFiles($AccountID, $Attachments);
		if (!is_array($tempFiles)) {
			return false;
		}

		$userUUID = \Aurora\System\Api::getUserUUIDById($UserId);
		$res = false;
		foreach ($tempFiles as $tempName => $encodedData) {
			$data = \Aurora\System\Api::DecodeKeyValues($encodedData);
			if (!is_array($data) || !isset($data['FileName'])) {
				continue;
			}

			$fileName = (string) $data['FileName'];
			$filecacheManager = new \Aurora\System\Managers\Filecache();
			$resource = $filecacheManager->getFile($userUUID, $tempName);
			if (!$resource) {
				continue;
			}

			$multipart[] = [
				'headers' => ['Content-Type' => 'application/octet-stream'],
				'name' => 'file',
				'contents' => $resource,
				'filename' => $fileName,
			];
		}
		$multipart[] = [
			'name' => 'parent_dir',
			'contents' => $ParentDir,
		];
		$client = new Client();
		$res = $client->post($UploadLink, [
			'headers' => $Headers,
			'multipart' => $multipart,
		]);

		if ($res->getStatusCode() === 200) {
			$result = true;
		}

		return $result;
	}

	public function SaveSeafilesAsTempfiles($UserId, $Files, $Headers)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (!is_array($Files) || 0 === count($Files)) {
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		$client = new Client();

		$userUUID = \Aurora\System\Api::getUserUUIDById($UserId);
		$result = [];
		foreach ($Files as $file) {
			$fileName = $file['Name'];
			$fileHash = $file['Hash'];
			$downloadLink = $file['Link'];

			$res = $client->get($downloadLink, [
				'headers' => $Headers
			]);

			$fileResource = null;
			$size = 0;
			if ($res->getStatusCode() === 200) {
				$resource = $res->getBody();
				$size = $resource->getSize();
				$fileResource = StreamWrapper::getResource($resource);
			}

			$tempName = md5($downloadLink . microtime(true).rand(1000, 9999));

			$filecacheManager = new \Aurora\System\Managers\Filecache();
			if (is_resource($fileResource) && $filecacheManager->putFile($userUUID, $tempName, $fileResource)) {
				$newFileHash = \Aurora\System\Api::EncodeKeyValues(array(
					'TempFile' => true,
					'UserId' => $UserId,
					'Name' => $fileName,
					'TempName' => $tempName
				));

				$actions = [
					'view' => [
						'url' => '?file-cache/' . $newFileHash .'/view'
					],
					'download' => [
						'url' => '?file-cache/' . $newFileHash
					],
				];

				$result[] = [
					'Name' => $fileName,
					'TempName' => $tempName,
					'Size' => $size,
					'Hash' => $fileHash,
					'NewHash' => $newFileHash,
					'MimeType' => \MailSo\Base\Utils::MimeContentType($fileName),
					'Actions' => $actions
				];

				@fclose($fileResource);
			}
		}

		return $result;
	}
}
