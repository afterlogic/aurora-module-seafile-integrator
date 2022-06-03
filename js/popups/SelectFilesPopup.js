'use strict';

const
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),

	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	CDateModel = require('%PathToCoreWebclientModule%/js/models/CDateModel.js'),
	CSelector = require('%PathToCoreWebclientModule%/js/CSelector.js'),
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),

	CreateFolderPopup = require('modules/%ModuleName%/js/popups/CreateFolderPopup.js'),
	SeafileApi = require('modules/%ModuleName%/js/utils/SeafileApi.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

function parseLastModified (lastModified)
{
	const dateModel = new CDateModel();
	if (lastModified) {
		dateModel.parse(lastModified);
		return dateModel.getShortDate();
	}
	return '';
}

function getThumbnailSrc(thumbnailSrc)
{
//	if (thumbnailSrc) {
//		return `${Settings.SeafileHost}${thumbnailSrc}`;
//	}
	return '';
}
/**
 * @constructor
 */
function CSelectFilesPopup()
{
	CAbstractPopup.call(this);

	this.selectFilesMode = ko.observable(false);

	this.storages = [
		{
			label: TextUtils.i18n('%MODULENAME%/LABEL_MINE_STORAGE'),
			name: 'mine',
			iconCssClass: 'typepersonal'
		},
		{
			label: TextUtils.i18n('%MODULENAME%/LABEL_SHARED_STORAGE'),
			name: 'shared',
			iconCssClass: 'typeshared'
		}
	];
	this.allowedStorages = ko.computed(function () {
		if (this.selectFilesMode()) {
			return this.storages;
		}
		return this.storages.filter(storage => storage.name === 'mine');
	}, this);
	this.selectedStorage = ko.observable('');
	this.selectedStorageLabel = ko.computed(function () {
		const storage = this.allowedStorages().find(storage => storage.name === this.selectedStorage());
		return storage && storage.label || '';
	}, this);

	this.loadingRepos = ko.observable(false);
	this.mineRepos = [];
	this.sharedRepos = [];
	this.currentRepos = ko.observableArray([]);
	this.selectedRepoId = ko.observable('');
	this.selectedRepoName = ko.computed(function () {
		const repo = this.currentRepos().find(repo => repo.repo_id === this.selectedRepoId());
		return repo && repo.repo_name || '';
	}, this);

	this.loadingRepoDir = ko.observable(false);
	this.folders = ko.observableArray([]);
	this.files = ko.observableArray([]);
	this.currentDirName = ko.observable('');
	this.currentParentDir = ko.observable('');
	this.currentParentDirParts = ko.computed(function () {
		return this.currentParentDir().split('/').filter(part => part.length > 0);
	}, this);

	this.selectedRepoEmpty = ko.computed(function () {
		return !this.loadingRepos() && !this.loadingRepoDir() && this.selectedRepoId() && this.folders().length === 0 && this.files().length === 0;
	}, this);

	this.selector = new CSelector(this.files, null, null, this.selectFiles.bind(this), null, null, true, true, true);

	this.isEnableSaving = ko.computed(function () {
		return this.selectedRepoId() !== '';
	}, this);
	this.saveAttachmentsCommand = Utils.createCommand(this, this.saveAttachments, this.isEnableSaving);

	this.callback = null;
}

_.extendOwn(CSelectFilesPopup.prototype, CAbstractPopup.prototype);

CSelectFilesPopup.prototype.PopupTemplate = '%ModuleName%_SelectFilesPopup';

CSelectFilesPopup.prototype.onBind = function ($popupDom)
{
	var $dom = this.$viewDom || $popupDom;
	this.selector.initOnApplyBindings(
		'.items_sub_list .item',
		'.items_sub_list .selected.item',
		'.items_sub_list .item .custom_checkbox',
		$('.panel.files .items_list', $dom),
		$('.panel.files .items_list .files_scroll.scroll-inner', $dom)
	);
};

CSelectFilesPopup.prototype.onOpen = function ({ selectFilesMode, callback })
{
	this.selectFilesMode(selectFilesMode);
	this.callback = callback;

	this.currentRepos([]);
	this.selectedRepoId('');
	this.folders([]);
	this.files([]);
	this.currentDirName('');
	this.currentParentDir('');

	this.selectedStorage(this.allowedStorages()[0].name);
	this.loadingRepos(true);
	SeafileApi.getRepos((parsedResult, request) => {
		this.loadingRepos(false);
		const allRepos = parsedResult && parsedResult.repos;
		if (Array.isArray(allRepos)) {
			this.mineRepos = allRepos.filter(repo => repo.type === 'mine');
			this.sharedRepos = allRepos.filter(repo => repo.type === 'shared');
			this.populateCurrentRepos();
		}
	});
};

CSelectFilesPopup.prototype.selectStorage = function (storageName)
{
	if (this.selectedStorage() === storageName) {
		return;
	}

	this.selectedStorage(storageName);
	this.populateCurrentRepos();
	this.showRepo('');
};

CSelectFilesPopup.prototype.showAllRepos = function ()
{
	this.showRepo('');
};

CSelectFilesPopup.prototype.showRepo = function (repoId)
{
	this.selectedRepoId(repoId);
	if (repoId === '') {
		return;
	}

	this.currentDirName('');
	this.currentParentDir('');
	this.getRepoDir();
};

CSelectFilesPopup.prototype.showDir = function (dirName, parentDir)
{
	this.currentDirName(dirName);
	this.currentParentDir(parentDir);
	this.getRepoDir();
};

CSelectFilesPopup.prototype.getRepoDir = function ()
{
	this.folders([]);
	this.files([]);
	this.loadingRepoDir(true);
	const parameters = {
		repoId: this.selectedRepoId(),
		dirName: this.currentDirName(),
		parentDir: this.currentParentDir()
	};
	SeafileApi.getRepoDir(parameters, (parsedResult, request) => {
		const allDirs = parsedResult && parsedResult.dirent_list;
		if (Array.isArray(allDirs)) {
			this.loadingRepoDir(false);
			this.folders(allDirs.filter(item => item.type === 'dir'));
			const files = allDirs
					.filter(item => item.type === 'file')
					.map(file => {
						file.thumbnailSrc = getThumbnailSrc(file.encoded_thumbnail_src);
						file.extension = Utils.getFileExtension(file.name).toLowerCase();
						file.friendlySize = file.size > 0 ? TextUtils.getFriendlySize(file.size) : '';
						file.lastModified = parseLastModified(file.mtime);
						file.checked = ko.observable(false);
						file.selected = ko.observable(false);
						return file;
					});
			this.files(files);
		}
	});
};

CSelectFilesPopup.prototype.showParentDir = function (index, dirName)
{
	let parentDir = '/';
	if (index > 0) {
		const parentDirParts = this.currentParentDirParts().slice(0, index);
		parentDirParts.unshift('');
		parentDirParts.push('');
		parentDir = parentDirParts.join('/');
	}
	this.showDir(dirName, parentDir);
};

CSelectFilesPopup.prototype.populateCurrentRepos = function ()
{
	let currentRepos = [];
	if (this.selectedStorage() === 'mine') {
		currentRepos = this.mineRepos;
	} else if (this.selectedStorage() === 'shared') {
		currentRepos = this.sharedRepos;
	}
	this.currentRepos(currentRepos);
};

CSelectFilesPopup.prototype.selectFiles = function ()
{
	if (_.isFunction(this.callback)) {
		this.callback(this.selectedRepoId(), this.selector.listCheckedAndSelected());
	}

	this.closePopup();
};

CSelectFilesPopup.prototype.createFolder = function ()
{
	const
		parentDir = `${this.currentParentDir()}${this.currentDirName()}/`,
		callback = (newDirName) => {
//			this.currentDirName(newDirName);
//			this.currentParentDir(parentDir);
			this.getRepoDir();
		};
	Popups.showPopup(CreateFolderPopup, [this.selectedRepoId(), this.selectedRepoName(), parentDir, callback]);
};

CSelectFilesPopup.prototype.saveAttachments = function ()
{
	if (_.isFunction(this.callback)) {
		const dirName = `${this.currentParentDir()}${this.currentDirName()}/`;
		this.callback(this.selectedRepoId(), dirName || '/');
	}

	this.closePopup();
};

module.exports = new CSelectFilesPopup();
