'use strict';

const
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
	Popups.showPopup(SelectFilesPopup, [(selectedFiles) => {
		console.log(selectedFiles);
	}]);
};

module.exports = new CUploadButtonOnComposeView();
