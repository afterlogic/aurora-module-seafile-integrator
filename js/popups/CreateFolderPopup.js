'use strict';

const
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),

	Api = require('%PathToCoreWebclientModule%/js/Api.js'),

	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),

	SeafileApi = require('modules/%ModuleName%/js/utils/SeafileApi.js')
;

/**
 * @constructor
 */
function CCreateFolderPopup()
{
	CAbstractPopup.call(this);

	this.isCreating = ko.observable(false);

	this.repoId = '';
	this.parentDir = ko.observable('');
	this.parentDirPath = ko.observable('');
	this.dirName = ko.observable('');
	this.dirNameFocus = ko.observable(false);

	this.callback = null;
}

_.extendOwn(CCreateFolderPopup.prototype, CAbstractPopup.prototype);

CCreateFolderPopup.prototype.PopupTemplate = '%ModuleName%_CreateFolderPopup';

/**
 * @param {string} repoId
 * @param {string} repoName
 * @param {string} parentDir
 * @param {function} callback
 */
CCreateFolderPopup.prototype.onOpen = function (repoId, repoName, parentDir, callback)
{
	this.callback = callback;
	this.repoId = repoId;
	this.parentDir(parentDir);
	const parentDirPath = repoName + parentDir;
	this.parentDirPath(parentDirPath.replace(/\/$/, ''));
	this.dirName('');
	this.dirNameFocus(true);
};

CCreateFolderPopup.prototype.create = function ()
{
	const parameters = {
		repoId: this.repoId,
		dirName: this.dirName(),
		parentDir: this.parentDir() || '/'
	};
	this.isCreating(true);
	SeafileApi.createDir(parameters, (parsedResult, request) => {
		this.isCreating(false);
		if (_.isFunction(this.callback)) {
			this.callback(this.dirName());
		}
		this.closePopup();
	});
};

module.exports = new CCreateFolderPopup();
