'use strict';

const
	_ = require('underscore'),
	ko = require('knockout'),

	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),

	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),

	SeafileApi = require('modules/%ModuleName%/js/utils/SeafileApi.js')
;

/**
 * @constructor
 */
function CAskLibraryPasswordPopup()
{
	CAbstractPopup.call(this);

	this.isApplying = ko.observable(false);

	this.repoId = '';
	this.password = ko.observable('');
	this.passwordFocus = ko.observable(false);

	this.callback = null;

	this.applyCommand = Utils.createCommand(this, this.apply, () => {
		return !this.isApplying();
	});
	this.cancelCommand = Utils.createCommand(this, this.cancelPopup, () => {
		return !this.isApplying();
	});
}

_.extendOwn(CAskLibraryPasswordPopup.prototype, CAbstractPopup.prototype);

CAskLibraryPasswordPopup.prototype.PopupTemplate = '%ModuleName%_AskLibraryPasswordPopup';

/**
 * @param {string} repoId
 * @param {function} callback
 */
CAskLibraryPasswordPopup.prototype.onOpen = function (repoId, callback)
{
	this.repoId = repoId;
	this.password('');
	this.passwordFocus(true);
	this.callback = callback;
	this.isApplying(false);
};

CAskLibraryPasswordPopup.prototype.apply = function ()
{
	if (this.isApplying()) {
		return;
	}
	const parameters = {
		repoId: this.repoId,
		password: this.password()
	};
	this.isApplying(true);
	SeafileApi.applyPassword(parameters, (parsedResult, request) => {
		this.isApplying(false);
		if (parsedResult === 'success') {
			if (_.isFunction(this.callback)) {
				this.callback();
			}
			this.closePopup();
		}
	});
};

module.exports = new CAskLibraryPasswordPopup();
