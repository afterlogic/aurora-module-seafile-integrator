'use strict';

const
	_ = require('underscore'),
	$ = require('jquery'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),

	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),

	Settings = require('modules/%ModuleName%/js/Settings.js'),

	token = $.cookie('seahub_token'),
	authorizationHeaders = {
		'Authorization': `Token ${token}`
	}
;

function getSeafileResponse(url, callback, postData = false) {
	const parameters = {
		Url: url,
		Headers: authorizationHeaders
	};
	if (postData) {
		parameters.PostData = postData;
	}
	Ajax.send('%ModuleName%', 'GetSeafileResponse', parameters, (response, request, status) => {
		const result = status === 200 && response && response.Result;
		let parsedResult = result ? JSON.parse(result) : result;
		if (parsedResult && parsedResult.error_msg) {
			Screens.showError(parsedResult.error_msg);
			parsedResult = null;
		} else if (!parsedResult && typeof parsedResult !== 'string') {
			Api.showErrorByCode(response);
		}
		callback(parsedResult, request);
	});
}

module.exports = {
	getRepos: function (callback) {
		getSeafileResponse(`${Settings.SeafileHost}api2/repos`, callback);
	},

	getRepoDir: function ({ repoId, dirName = '', parentDir = '' }, callback) {
		if (dirName) {
			const p = encodeURI(`${parentDir}${dirName}`);
			getSeafileResponse(`${Settings.SeafileHost}api2/repos/${repoId}/dir?p=${p}`, callback);
		} else {
			getSeafileResponse(`${Settings.SeafileHost}api2/repos/${repoId}/dir`, callback);
		}
	},

	createDir: function ({ repoId, dirName, parentDir }, callback) {
		const p = encodeURI(`${parentDir}${dirName}`);
		getSeafileResponse(`${Settings.SeafileHost}api2/repos/${repoId}/dir/?p=${p}`, callback, { operation: 'mkdir' });
	},

	getRepoData: function ({ repoId }, callback) {
		getSeafileResponse(`${Settings.SeafileHost}api/v2.1/repos/${repoId}/`, callback);
	},

	applyPassword: function ({ repoId, password }, callback) {
		getSeafileResponse(`${Settings.SeafileHost}api2/repos/${repoId}/`, callback, { password });
	},

	saveSeafilesAsTempfiles: function ({ repoId, parentDir, files }, callback) {
		const parameters = {
			Headers: authorizationHeaders,
			Files: files.map(file => {
				return {
					Name: file.name,
					Hash: file.id,
					Link: `${Settings.SeafileHost}api2/repos/${repoId}/file/?p=${parentDir}${file.name}`
				};
			})
		};
		// {{Host}}api2/repos/{{MineRepoId}}/file/?p={{FileParentDir}}{{FileName}}
		Ajax.send('%ModuleName%', 'SaveSeafilesAsTempfiles', parameters, (response, request, status) => {
			callback(response, request);
		});
	},

	saveToSeafile: function ({ accountId, hashes, repoId, dirName }) {
		const
			p = encodeURI(dirName),
			url = `${Settings.SeafileHost}api2/repos/${repoId}/upload-link/?p=${p}`
		;
		getSeafileResponse(url, (parsedResult, request) => {
			Screens.showLoading(TextUtils.i18n('COREWEBCLIENT/INFO_LOADING'));
			const parameters = {
				AccountID: accountId,
				Attachments: hashes,
				UploadLink: `${parsedResult}?ret-json=1`,
				Headers: authorizationHeaders,
				ParentDir: dirName
			};
			Ajax.send('%ModuleName%', 'SaveAttachmentsToSeafile', parameters, function (response) {
				Screens.hideLoading();
				if (response.Result) {
					Screens.showReport(TextUtils.i18n('%MODULENAME%/INFO_ATTACHMENTS_SAVED_SUCCESSFULLY'));
				} else {
					Api.showErrorByCode(response);
				}
			});
		});
	}
};
