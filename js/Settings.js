'use strict';

const
	_ = require('underscore'),

	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	SeafileHost: '',
	SeafileApiHost: '',

	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} appData Object contained modules settings.
	 */
	init: function (appData)
	{
		let
			moduleData = appData['%ModuleName%'],
			seafileHost = Types.pString(moduleData && moduleData.SeafileHost),
			seafileApiHost = Types.pString(moduleData && moduleData.SeafileApiHost)
		;
		if (seafileHost.slice(-1) !== '/') {
			seafileHost += '/';
		}
		if (seafileApiHost.slice(-1) !== '/') {
			seafileApiHost += '/';
		}
		this.SeafileHost = seafileHost;
		this.SeafileApiHost = seafileApiHost;
	}
};
