<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\SeafileIntegrator;

use Aurora\System\SettingsProperty;

/**
 * @property bool $Disabled
 * @property string $AccessKey
 * @property string $SecretKey
 * @property string $Region
 * @property string $Host
 * @property string $BucketPrefix
 * @property int $PresignedLinkLifetimeMinutes
 * @property bool $RedirectToOriginalFileURLs
 */

class Settings extends \Aurora\System\Module\Settings
{
    protected function initDefaults()
    {
        $this->aContainer = [
            "Disabled" => new SettingsProperty(
                false,
                "bool",
                null,
                "Setting to true disables the module",
            ),
            "SeafileHost" => new SettingsProperty(
                "",
                "string",
                null,
                "Seafile installation host",
            ),
        ];
    }
}
