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
		const moduleData = appData['%ModuleName%'];

		if (!_.isEmpty(moduleData)) {
			this.SeafileHost = Types.pString(moduleData.SeafileHost);
			this.SeafileApiHost = Types.pString(moduleData.SeafileApiHost);
		}
	}
};
