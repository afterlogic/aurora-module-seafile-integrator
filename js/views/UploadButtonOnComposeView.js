'use strict';

const
	_ = require('underscore'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),

	CAttachmentModel = require('modules/MailWebclient/js/models/CAttachmentModel.js'),

	SeafileApi = require('modules/%ModuleName%/js/utils/SeafileApi.js'),
	SelectFilesPopup = require('modules/%ModuleName%/js/popups/SelectFilesPopup.js')
;

/**
* @constructor
*/
function CUploadButtonOnComposeView()
{

}

CUploadButtonOnComposeView.prototype.ViewTemplate = '%ModuleName%_UploadButtonOnComposeView';

CUploadButtonOnComposeView.prototype.assignComposeExtInterface = function(extInterface)
{
	this.composeAddUploadingAttachments = extInterface.addUploadingAttachments;
	this.composeOnFilesUpload = extInterface.onFilesUpload;
	this.koComposeSenderAccountId = extInterface.koSenderAccountId;
};

CUploadButtonOnComposeView.prototype.openSeafilePopup = function()
{
	const popupParams = {
		selectFilesMode: true,
		callback: this.uploadSeafiles.bind(this)
	};
	Popups.showPopup(SelectFilesPopup, [popupParams]);
};

CUploadButtonOnComposeView.prototype.uploadSeafiles = function(repoId, files)
{
	if (!_.isFunction(this.composeOnFilesUpload) || !_.isFunction(this.koComposeSenderAccountId) ||
		!_.isFunction(this.composeAddUploadingAttachments)
	) {
		return;
	}

	const parameters = { repoId, files };
	SeafileApi.saveSeafilesAsTempfiles(parameters, (response, request) => {
		this.composeOnFilesUpload(response, request);
	});

	const attachments = files.map(file => {
		const attachment = new CAttachmentModel(this.koComposeSenderAccountId());
		attachment.fileName(file.name);
		attachment.hash(file.id);
		attachment.uploadStarted(true);
		return attachment;
	});
	this.composeAddUploadingAttachments(attachments);
};

module.exports = new CUploadButtonOnComposeView();
