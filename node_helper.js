'use strict';

/* Magic Mirror
 * Module: MMM-Tesla2
 *
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
const Bluelinky = require('bluelinky');

module.exports = NodeHelper.create({

	start: function() {
		this.started = false;
		this.config = null;
    this.vehicle_data = null;
  },

  getData: function () {
    var self = this;
    const config = {
      username: this.config.username,
      password: this.config.password,
      region: this.config.region,
      pin: this.config.pin,
      vin : this.config.vin
    };

    const client = new Bluelinky(config);

    client.on('error', async (err) => {
        await errorHandler(err);
    });

    let errorHandler = async (err) => {
        let source = err.source;
        let statusCode = source.statusCode;
        let errorJson = source.body;
        let errorMessage = errorJson.errMsg;

        //Bad request
        if (statusCode == 400) {
            console.log(`Bluelink returned an error: Bad request: ${errorMessage}, likely invalid credentials.`);
        }
      
        console.log(`An error occurred: ${errorMessage}`);
    }

    client.on('ready', async () => {

      let vehicle = null;

      //If no VIN was provided, use the first vehicle in the list and get its VIN
      if (!this.config.vin || this.config.vin.trim() === '') {
          let vehicles = await client.getVehicles();
          if (vehicles && vehicles.length > 0) {
              this.config.vin = vehicles[0].vehicleConfig.vin;
          }
      }

      if (!this.config.vin || this.config.vin.trim() === '') {
          console.error(`No VIN was provided, and no appropriate VIN could be located.`)
          throw new Error('No VIN provided');
      }

      //Get the vehicle in question
      try {
          vehicle = await client.getVehicle(this.config.vin);
      }
      catch (err){
          console.log(`Unable to get the vehicle with VIN ${this.config.vin}.`);
          //So, invalid VIN, but what if they have exactly one vehicle?  Default to that one.
          let vehicles = await client.getVehicles();
          if (vehicles.length === 1) {
              console.warn(`The VIN supplied in the config ${this.config.vin} was invalid, but since there is only a single vehicle anyway, using that one instead.`);
              config.vin = vehicles[0].vehicleConfig.vin;
              vehicle = await client.getVehicle(config.vin);
          } else {
              console.error(`The VIN supplied in the config was invalid, and there are ${vehicles.length} possible vehicles available.  Please supply a valid VIN for the needed vehicle.`);
              throw new Error(`Unable to get the vehicle with VIN ${this.config.vin}.`);
          } 
      }


      // Check if we should wake the car to refresh the data:
      // This happens when this is the first time after the module started and the config allowes it
      const refresh = this.config.wakeOnRefresh || (!this.started && this.config.wakeOnModuleLoad);

      let statusRequest = {
        parsed: false,
        refresh: refresh
      };

      // Get non-parsed bluelinky data
      //Side note: Vehicle status is also on the vehicle object::  vehicle._status
      const vehicleStatus = await vehicle.status(statusRequest);

      // Get location
      //Side note: Vehicle location is also on the vehicle object: vehicle._location
      const location = await vehicle.location();

      const newCarData = {
        ...vehicleStatus,
        ...location,
        name: vehicle.vehicleConfig.name + ' (' + vehicle.vehicleConfig.generation + ')',
      };

      self.vehicle_data = newCarData;
      self.sendSocketNotification("CAR_DATA", newCarData);

      if (vehicleStatus.evStatus.batteryCharge) {
        setTimeout(function() { self.getData(); }, this.config.refreshIntervalWhileCharging);
      } else {
        setTimeout(function() { self.getData(); }, this.config.refreshIntervalWhileDisconnected);
      }
    });
  },

	socketNotificationReceived: async function(notification, payload) {
		var self = this;

		if (notification === 'BLUELINKY2_CONFIG' && self.started == false) {
			self.config = payload;
			self.sendSocketNotification("STARTED", true);
			self.getData();
			self.started = true;
		} 
    else if (notification == 'REFRESH') {
			self.getData();
		} 
    else if (notification == 'BLUELINKY2_CONFIG') {
			self.sendSocketNotification("CAR_DATA", self.vehicle_data);
		}
	}
});
