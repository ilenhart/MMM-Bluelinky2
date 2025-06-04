/* global Module */

/* Magic Mirror
 * Module: MMM-Bluelinky2
 *
 * By Isaac Lenhart
 * MIT Licensed.
 */

Module.register("MMM-Bluelinky2",{

	defaults: {
		wakeOnModuleLoad: false,
		wakeOnRefresh: false,
		showLastUpdated: true,
		region: 'US',
		refreshIntervalWhileCharging: 1000 * 60 * 10, // update every 10 minutes
		refreshIntervalWhileDisconnected: 1000 * 60 * 60 // update every 60 minutes
	},

	// Define required scripts.
	getScripts: function() {
		return [];
	},

	getStyles: function() {
		return [];
	},

	start: function() {
		Log.info('Starting module: ' + this.name);
		this.loaded = false;
		this.latestData = Date.now();
		this.sendSocketNotification('BLUELINKY2_CONFIG', this.config);
	},

	getDom: function() {
		var batteryWidth = 300;
		var batteryHeight = batteryWidth/4;
		var wrapper = document.createElement("div");

		if (!this.loaded) {
			wrapper.innerHTML = this.translate('LOADING');
			return wrapper;
		}

		if (!this.battery_level) {
			wrapper.innerHTML = "No correct data found";
			return wrapper;
		}

		var textElement = document.createElement("div");
		if(this.charging_state == "Charging") {
			const timeLeft = this.vehicleData.evStatus.remainTime2.atc.value/60;
			var prettyPrintedState = this.charging_state + ' ('
			+ Math.floor(timeLeft) + 'h to go)';
		}
		else {
			var prettyPrintedState = this.charging_state;
		}
		const sleep = (this.vehicleData.sleepModeCheck ? ' <span style="font-size: 12pt;">Sleeping</span>' : '');
		const title = this.config.name ? '<b>' + this.config.name + sleep + '</b><br />' : '<br>' + this.vehicle_name + sleep + '</br><br/>';
		textElement.innerHTML = title + prettyPrintedState + ' - ' + Math.floor(this.range) + ' km';

		wrapper.appendChild(textElement);

		var svgNS = "http://www.w3.org/2000/svg";
		var svg = document.createElementNS(svgNS, "svg");
		svg.setAttribute('width', batteryWidth);
		svg.setAttribute('height', batteryHeight);

		var batteryFrame = document.createElementNS(svgNS, "rect");

		batteryFrame.setAttribute('width', batteryWidth);
		batteryFrame.setAttribute('height', batteryHeight);
		batteryFrame.setAttribute('style', "fill:rgba(0,0,0,0);stroke-width:2;stroke:rgba(255,255,255, 0.75)");
		batteryFrame.setAttribute("rx", batteryWidth/80);
		batteryFrame.setAttribute("ry", batteryWidth/80);
		svg.appendChild(batteryFrame);

		var shiftedContentContainer = document.createElementNS(svgNS, "svg");
		shiftedContentContainer.setAttribute("x", batteryWidth/80);
		shiftedContentContainer.setAttribute("y", batteryWidth/80);

		var batteryContent = document.createElementNS(svgNS, "rect");

		batteryContent.setAttribute('width', this.battery_level/100*batteryWidth);
		batteryContent.setAttribute('height', batteryHeight*0.9);

		var fillColor = "fill:rgba(45,220,45,0.7)";
		if (this.battery_level < 75)
			fillColor = "fill:rgba(220,220,45,0.7)";
		else if (this.battery_level <= 50)
			fillColor = "fill:rgba(220,120,45,0.7)";
		else if (this.battery_level < 25)
			fillColor = "fill:rgba(220,45,45,0.7)";
		else
			fillColor = "fill:rgba(45,220,45,0.7)";

		batteryContent.setAttribute('style', fillColor );
		batteryContent.setAttribute("rx", batteryWidth/200);
		batteryContent.setAttribute("ry", batteryHeight/50);
		shiftedContentContainer.appendChild(batteryContent);

		var chargeLevelText = document.createElementNS(svgNS, "text");
		chargeLevelText.setAttribute("x", 25/200*batteryWidth);
		chargeLevelText.setAttribute("y", 36/50*batteryHeight);
		chargeLevelText.setAttribute("style", "fill:rgba(255,255,255,0.4); font: bold " + 20*batteryWidth/200 + "px sans-serif;");

		var textNode = document.createTextNode(this.battery_level + '%');
		chargeLevelText.appendChild(textNode);
		shiftedContentContainer.appendChild(chargeLevelText);

		var batteryBar = document.createElementNS(svgNS, "path");
		batteryBar.setAttribute("stroke", "#ffffff");
		batteryBar.setAttribute("d", "M" + batteryWidth*50/100 + " 0 L" + batteryWidth*50/100 + " " + +batteryHeight + +2);
		batteryBar.setAttribute('stroke-width', "2");
		batteryBar.setAttribute('opacity', "0.25");
		shiftedContentContainer.appendChild(batteryBar);

		var batteryBar = document.createElementNS(svgNS, "path");
		batteryBar.setAttribute("stroke", "#ffffff");
		batteryBar.setAttribute("d", "M" + batteryWidth*60/100 + " 0 L" + batteryWidth*60/100 + " " + +batteryHeight + +2);
		batteryBar.setAttribute('stroke-width', "2");
		batteryBar.setAttribute('opacity', "0.25");
		shiftedContentContainer.appendChild(batteryBar);

		var batteryBar = document.createElementNS(svgNS, "path");
		batteryBar.setAttribute("stroke", "#ffffff");
		batteryBar.setAttribute("d", "M" + batteryWidth*70/100 + " 0 L" + batteryWidth*70/100 + " " + +batteryHeight + +2);
		batteryBar.setAttribute('stroke-width', "2");
		batteryBar.setAttribute('opacity', "0.25");
		shiftedContentContainer.appendChild(batteryBar);

		var batteryBar = document.createElementNS(svgNS, "path");
		batteryBar.setAttribute("stroke", "#ffffff");
		batteryBar.setAttribute("d", "M" + batteryWidth*80/100 + " 0 L" + batteryWidth*80/100 + " " + +batteryHeight + +2);
		batteryBar.setAttribute('stroke-width', "2");
		batteryBar.setAttribute('opacity', "0.25");
		shiftedContentContainer.appendChild(batteryBar);

		var batteryBar = document.createElementNS(svgNS, "path");
		batteryBar.setAttribute("stroke", "#ffffff");
		batteryBar.setAttribute("d", "M" + batteryWidth*90/100 + " 0 L" + batteryWidth*90/100 + " " + +batteryHeight + +2);
		batteryBar.setAttribute('stroke-width', "2");
		batteryBar.setAttribute('opacity', "0.25");
		shiftedContentContainer.appendChild(batteryBar);

		svg.appendChild(shiftedContentContainer);
		wrapper.appendChild(svg);

		var timeago = document.createElement("div");
		timeago.innerText = this.updateAgo;
		timeago.style.fontSize = "10pt";
		timeago.style.lineHeight = "10pt"
		wrapper.appendChild(timeago);

		return wrapper;
	},

	processVehicleData: function(carData) {
		//carData, see node_helper.js, CAR_DATA notification
		this.latestData = Date.now();
		console.log('Process vehicle data BlueLinky2:', carData);
		this.vehicleData = carData;
		this.vehicle_name = carData.name;
		this.charging_state = carData.evStatus.batteryCharge ? 'Charging' : 'Disconnected';
		this.battery_level = carData.evStatus.batteryStatus;
		this.range = carData.evStatus.drvDistance[0].rangeByFuel.evModeRange.value;
		return;
	},

 	socketNotificationReceived: function(notification, payload) {
		
		if (this.timer) clearTimeout(this.timer);

		this.updateAgo = 'Updated less than a minute ago';

		if (notification === "STARTED") {
			this.updateDom();
		}
		else if (notification === "CAR_DATA") {
			if (!payload) return;

      		this.loaded = true;
			this.processVehicleData(payload);
			this.updateDom();
		}

		if (this.config.showLastUpdated) {
			// "Last update 1m ago" function:
			this.timer = () => setTimeout(() => {
				const ms = Date.now() - this.latestData;
				const newtime = Math.floor(ms / 1000 / 60)
				this.updateAgo = `Updated ${ms < 60 ? 'less than a minute' : `${newtime === 1 ? `${newtime} minute` : `${newtime} minutes`}`} ago`
				this.timer();
				this.updateDom();
			}, 60000)
			this.timer();
		}
	},
});
