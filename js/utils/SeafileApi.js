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

	sessionid = $.cookie('sessionid'),
	cookieHeaders = {
		'Cookie': `sessionid=${sessionid}`
	},

	token = $.cookie('seahub_token'),
	authorizationHeaders = {
		'Authorization': `Token ${token}`
	}
;

function getSeafileResponse(url, callback) {
	const parameters = {
		Url: url,
		Headers: authorizationHeaders
	};
	Ajax.send('%ModuleName%', 'GetSeafileResponse', parameters, (response, request, status) => {
		const
			result = status === 200 && response && response.Result,
			parsedResult = result ? JSON.parse(result) : null
		;
		if (!parsedResult) {
			Api.showErrorByCode(response);
		}
		callback(parsedResult, request);
	});
}

module.exports = {
	getRepos: function (callback) {
		getSeafileResponse(`${Settings.SeafileApiHost}repos`, callback);
	},

	getRepoDir: function ({ repoId, dirName = '', parentDir = '' }, callback) {
		if (dirName) {
			const p = encodeURI(`${parentDir}${dirName}`);
			getSeafileResponse(`${Settings.SeafileApiHost}repos/${repoId}/dir?p=${p}&with_thumbnail=true`, callback);
		} else {
			getSeafileResponse(`${Settings.SeafileApiHost}repos/${repoId}/dir?with_thumbnail=true`, callback);
		}
	},

	createDir: function ({ repoId, dirName, parentDir }, callback) {
		const p = encodeURI(`${parentDir}${dirName}`);
		getSeafileResponse(`${Settings.SeafileHost}api2/repos/${repoId}/dir?p=${p}`, callback);
	},

	saveSeafilesAsTempfiles: function ({ repoId, files }, callback) {
		const parameters = {
			Headers: cookieHeaders,
			Files: files.map(file => {
				return {
					Name: file.name,
					Hash: file.id,
					Link: `${Settings.SeafileHost}lib/${repoId}/file${file.parent_dir}${file.name}?dl=1`
				};
			})
		};
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
