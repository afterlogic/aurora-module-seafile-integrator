'use strict';

const
	_ = require('underscore'),

	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	SeafileHost: '',

	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} appData Object contained modules settings.
	 */
	init: function (appData)
	{
		let
			moduleData = appData['%ModuleName%'],
			seafileHost = Types.pString(moduleData && moduleData.SeafileHost)
		;
		if (seafileHost.slice(-1) !== '/') {
			seafileHost += '/';
		}
		this.SeafileHost = seafileHost;
	}
};
