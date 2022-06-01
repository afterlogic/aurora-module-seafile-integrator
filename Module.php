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
 * Adds ability to work with S3 file storage inside Aurora Files module.
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
		setcookie('seahub_token', $oSettings->GetValue('Token', ''));
		setcookie('sessionid', $oSettings->GetValue('SessionId', ''));
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

	public function CurlExec($Url, $Headers)
	{
		$curl = curl_init();

		curl_setopt_array($curl, array(
			CURLOPT_URL => $Url,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_ENCODING => '',
			CURLOPT_MAXREDIRS => 10,
			CURLOPT_TIMEOUT => 0,
			CURLOPT_FOLLOWLOCATION => true,
			CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
			CURLOPT_CUSTOMREQUEST => 'GET',
			CURLOPT_HTTPHEADER => $Headers,
		));

		$response = curl_exec($curl);
		curl_close($curl);

		return $response;
	}

	public function GetFilesForUpload($UserId, $Files, $Headers)
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

			// TODO: get some temp name
			$tempName = md5($downloadLink . microtime(true).rand(1000, 9999));

			$oFilecacheManager = new \Aurora\System\Managers\Filecache();
			if (is_resource($fileResource) && $oFilecacheManager->putFile($userUUID, $tempName, $fileResource)) {
				$hash = \Aurora\System\Api::EncodeKeyValues(array(
					'TempFile' => true,
					'UserId' => $UserId,
					'Name' => $fileName,
					'TempName' => $tempName
				));

				$actions = [
					'view' => [
						'url' => '?file-cache/' . $hash .'/view'
					],
					'download' => [
						'url' => '?file-cache/' . $hash
					],
				];

				$result[] = [
					'Name' => $fileName,
					'TempName' => $tempName,
					'Size' => $size,
					'Hash' => $hash,
					'MimeType' => \MailSo\Base\Utils::MimeContentType($fileName),
					'Actions' => $actions
				];

				@fclose($fileResource);
			}
		}

		return $result;
	}
}
