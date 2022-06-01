'use strict';

module.exports = function (oAppData) {
	var
//		TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
		
		App = require('%PathToCoreWebclientModule%/js/App.js'),

		Settings = require('modules/%ModuleName%/js/Settings.js')
	;
	
	Settings.init(oAppData);

	if (App.isUserNormalOrTenant())
	{
		return {
			start: function (ModulesManager) {
				ModulesManager.run('MailWebclient', 'registerComposeUploadAttachmentsController',
					[require('modules/%ModuleName%/js/views/UploadButtonOnComposeView.js')]
				);
			}
		};
	}
	
	return null;
};
