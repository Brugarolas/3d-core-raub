'use strict';


const navigator = {
	appCodeName: 'Mozilla',
	appName: 'Netscape',
	appVersion: 'Node3D',
	bluetooth: {},
	clipboard: {},
	connection: {
		onchange: null, effectiveType: '4g', rtt: 50, downlink: 3.3, saveData: false
	},
	cookieEnabled: false,
	credentials: {},
	deviceMemory: 8,
	doNotTrack: null,
	geolocation: {},
	hardwareConcurrency: 4,
	keyboard: {},
	language: 'en',
	languages: ['en', 'en-US'],
	locks: {},
	maxTouchPoints: 0,
	mediaCapabilities: {},
	mediaDevices: { ondevicechange: null },
	mimeTypes: { length: 0 },
	onLine: false,
	permissions: {},
	platform: 'Any',
	plugins: { length: 0 },
	presentation: { defaultRequest: null, receiver: null },
	product: 'Node3D',
	productSub: '1',
	serviceWorker: {
		ready: Promise.resolve(false),
		controller: null,
		oncontrollerchange: null,
		onmessage: null
	},
	storage: {},
	usb: { onconnect: null, ondisconnect: null },
	userAgent: 'Mozilla/Node3D',
	vendor: 'Node3D',
	vendorSub: '',
	webkitPersistentStorage: {},
	webkitTemporaryStorage: {},
};


module.exports = { navigator };
