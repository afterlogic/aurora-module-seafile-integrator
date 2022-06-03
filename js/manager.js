'use strict';

module.exports = function (oAppData) {
	const
		App = require('%PathToCoreWebclientModule%/js/App.js'),

		Settings = require('modules/%ModuleName%/js/Settings.js')
	;

	Settings.init(oAppData);

	const seafileAllowed = !!(App.isUserNormalOrTenant() && Settings.SeafileHost && Settings.SeahubToken);
	if (seafileAllowed) {
		return {
			start: function (ModulesManager) {
				ModulesManager.run('MailWebclient', 'registerComposeUploadAttachmentsController',
					[require('modules/%ModuleName%/js/views/UploadButtonOnComposeView.js')]
				);
				App.subscribeEvent('MailWebclient::AddAllAttachmentsDownloadMethod', function (fAddAllAttachmentsDownloadMethod) {
					const TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js');

					fAddAllAttachmentsDownloadMethod({
						'Text': TextUtils.i18n('%MODULENAME%/ACTION_SAVE_ATTACHMENTS_TO_SEAFILE'),
						'Handler': function (accountId, hashes) {
							const
								Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
								SeafileApi = require('modules/%ModuleName%/js/utils/SeafileApi.js'),
								SelectFilesPopup = require('modules/%ModuleName%/js/popups/SelectFilesPopup.js'),
								popupParams = {
									selectFilesMode: false,
									callback: (repoId, dirName) => {
										SeafileApi.saveToSeafile({ accountId, hashes, repoId, dirName });
									}
								}
							;
							Popups.showPopup(SelectFilesPopup, [popupParams]);
						}
					});
				});
			}
		};
	}
	
	return null;
};
