'use strict';

const
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),

	SelectFilesPopup = require('modules/%ModuleName%/js/popups/SelectFilesPopup.js')
;

/**
* @constructor
*/
function CUploadButtonOnComposeView()
{

}

CUploadButtonOnComposeView.prototype.ViewTemplate = '%ModuleName%_UploadButtonOnComposeView';

CUploadButtonOnComposeView.prototype.openSeafilePopup = function()
{
	const popupParams = {
		selectFilesMode: true,
		callback: (selectedFiles) => {
			console.log(selectedFiles);
		}
	};
	Popups.showPopup(SelectFilesPopup, [popupParams]);
};

module.exports = new CUploadButtonOnComposeView();
