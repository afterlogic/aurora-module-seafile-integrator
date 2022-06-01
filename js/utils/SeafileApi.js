'use strict';

const
	_ = require('underscore'),
	$ = require('jquery'),

	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),

	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),

	Settings = require('modules/%ModuleName%/js/Settings.js'),

	sessionid = $.cookie('sessionid'),
	cookieHeaders = {
		'Cookie': `sessionid=${sessionid}`
	},

	token = $.cookie('seahub_token'),
	authorizationHeader = `Authorization: Token ${token}`
;

function curlExec(request, callback) {
	const url = `${Settings.SeafileApiHost}${request}`;
	const parameters = {
		Url: url,
		Headers: [authorizationHeader]
	};
	Ajax.send('%ModuleName%', 'CurlExec', parameters, (response, request, status) => {
		const result = status === 200 && response && response.Result;
		if (!result) {
			Api.showErrorByCode(response);
		}
		callback(result, request);
	});
}

module.exports = {
	getRepos: function (callback) {
		curlExec('repos', callback);
	},

	getRepoDir: function ({ repoId, dirName = '', parentDir = '' }, callback) {
		if (dirName) {
			const p = encodeURI(`${parentDir}${dirName}`);
			curlExec(`repos/${repoId}/dir?p=${p}&with_thumbnail=true`, callback);
		} else {
			curlExec(`repos/${repoId}/dir?with_thumbnail=true`, callback);
		}
	},

	getFilesForUpload: function ({ repoId, files }, callback) {
		const parameters = {
			Headers: cookieHeaders,
			Files: files.map(file => {
				return {
					Name: file.name,
					Link: `${Settings.SeafileHost}lib/${repoId}/file${file.parent_dir}${file.name}?dl=1`
				};
			})
		};
		Ajax.send('%ModuleName%', 'GetFilesForUpload', parameters, (response, request, status) => {
			const result = status === 200 && response && response.Result;
			if (!result) {
				Api.showErrorByCode(response);
			}
			callback(result, request);
		});
	}
};
