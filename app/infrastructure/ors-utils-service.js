angular.module("orsApp.utils-service", []).factory("orsUtilsService", [
  "$q",
  "$http",
  "$timeout",
  "$location",
  "$injector",
  "lists",
  "mappings",
  "ENV",
  ($q, $http, $timeout, $location, $injector, lists, mappings, ENV) => {
    let orsUtilsService = {};
    /**
     * trims coordinates
     * @param {Array} coords: List of untrimmed coords
     * @param {number} length: Amount of decimals
     * @return {list} coordsTrimmed: List of trimmed coords
     */
    orsUtilsService.trimCoordinates = (coords, length) => {
      let coordsTrimmed = [];
      for (let i = 0; i < coords.length; i++) {
        let pair = coords[i];
        if (pair !== undefined) {
          let ptA = pair[0].toString().split(".");
          let ptB = pair[1].toString().split(".");
          ptA = ptA[0] + "." + ptA[1].substr(0, 5);
          ptB = ptB[0] + "." + ptB[1].substr(0, 5);
          coordsTrimmed.push([ptA, ptB]);
        }
      }
      return coordsTrimmed;
    };
    /**
     * Sets extra information
     * @param {Object} obj - The settings object.
     */
    orsUtilsService.setExtraInformation = obj => {
      orsUtilsService.extra_information = obj;
    };
    /**
     * Gets extra information
     * @return {Object} obj - The settings object.
     */
    orsUtilsService.getExtraInformation = () => {
      return orsUtilsService.extra_information;
    };
    orsUtilsService.isInt = n => {
      return Number(n) === n && n % 1 === 0;
    };
    orsUtilsService.isFloat = n => {
      return Number(n) === n && n % 1 !== 0;
    };
    /**
     * checks whether position are valid coordinates
     * @param {String} lat: Latitude as string
     * @param {String} lng: Longitude as string
     * @return {boolean}: true or false
     */
    orsUtilsService.isCoordinate = (lat, lng) => {
      const ck_lat = /^(-?[1-8]?\d(?:\.\d{1,18})?|90(?:\.0{1,18})?)$/;
      const ck_lng = /^(-?(?:1[0-7]|[1-9])?\d(?:\.\d{1,18})?|180(?:\.0{1,18})?)$/;
      const validLat = ck_lat.test(lat);
      const validLon = ck_lng.test(lng);
      if (validLat && validLon) {
        return true;
      } else {
        return false;
      }
    };
    /**
     * Rounds decimal of coordinate
     * @param {String} coord: Coordinate
     * @return {String} latlng: String latLng representation "lat, lng"
     */
    orsUtilsService.roundCoordinate = coord => {
      coord = Math.round(coord * 1000000) / 1000000;
      return coord;
    };
    /**
     * parses leaflet latlng to string representation
     * @param {Object} latlng: Leaflet latLng Object
     * @return {String} latlng: String latLng representation "lat, lng"
     */
    orsUtilsService.parseLatLngString = function(latlng) {
      return (
        Math.round(latlng.lat * 1000000) / 1000000 +
        ", " +
        Math.round(latlng.lng * 1000000) / 1000000
      );
    };
    /**
     * parses leaflet latlng to string representation
     * @param {Object} latlng: Leaflet latLng Object
     * @return {String} latlng: String latLng representation "lat, lng"
     */
    orsUtilsService.parseLngLatString = function(latlng) {
      return (
        Math.round(latlng.lng * 1000000) / 1000000 +
        ", " +
        Math.round(latlng.lat * 1000000) / 1000000
      );
    };
    /**
     * Decodes to a [latitude, longitude] coordinates array.
     * @param {String} str
     * @param {Boolean} elevation
     * @param {Number} precision
     * @returns {Array}
     */
    orsUtilsService.decodePolyline = function(str, elevation, precision) {
      let index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision || 5);
      // Coordinates have variable length when encoded, so just keep
      // track of whether we've hit the end of the string. In each
      // loop iteration, a single coordinate is decoded.
      while (index < str.length) {
        // Reset shift, result, and byte
        byte = null;
        shift = 0;
        result = 0;
        do {
          byte = str.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        latitude_change = result & 1 ? ~(result >> 1) : result >> 1;
        shift = result = 0;
        do {
          byte = str.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        longitude_change = result & 1 ? ~(result >> 1) : result >> 1;
        lat += latitude_change;
        lng += longitude_change;
        coordinates.push([lat / factor, lng / factor]);
      }
      return coordinates;
    };
    /**
     * Requests shorten link
     * @param {String} requestData: XML for request payload
     */
    orsUtilsService.getShortenlink = location => {
      let requestData = {
        access_token: "d9c484e2c240975de02bfd2f2f4211ad3a0bab6d",
        longUrl: location
      };
      const url = ENV.shortenlink;
      const canceller = $q.defer();
      let cancel = reason => {
        canceller.resolve(reason);
      };
      let promise = $http
        .get(url, {
          params: requestData,
          timeout: canceller.promise
        })
        .then(response => {
          return response.data;
        });
      return {
        promise: promise,
        cancel: cancel
      };
    };
    /**
     * generates object for request and serializes it to http parameters
     * @param {Object} settings: route settings object
     * @param {Object} userSettings: To limit the amount of responses
     * @return {Object} payload: Paylod object used in xhr request
     */
    orsUtilsService.routingPayload = (settings, userSettings) => {
      let payload;
      payload = {
        profile: lists.profiles[settings.profile.type].request,
        preference: settings.profile.options.weight.toLowerCase(),
        language: userSettings.routinglang,
        geometry_format: "geojson",
        instructions: true,
        geometry: true,
        units: "m",
        attributes: "detourfactor|percentage",
        instructions_format: "html",
        elevation: lists.profiles[settings.profile.type].elevation,
        options: JSON.stringify(orsUtilsService.generateOptions(settings))
      };
      // remove options if empty
      if (payload.options.length == 2) delete payload.options;
      const subgroup = lists.profiles[settings.profile.type].subgroup;
      // prepare waypoints
      let waypoints = [];
      angular.forEach(settings.waypoints, function(waypoint) {
        if (waypoint._set == 1) waypoints.push(waypoint);
      });
      payload.coordinates = "";
      for (let j = 0, i = 0; i < waypoints.length; i++) {
        payload.coordinates +=
          orsUtilsService.roundCoordinate(waypoints[i]._latlng.lng) +
          "," +
          orsUtilsService.roundCoordinate(waypoints[i]._latlng.lat) +
          "|";
      }
      payload.coordinates = payload.coordinates.slice(0, -1);
      // extras
      payload.extra_info = [];
      const extra_infos = orsUtilsService.getExtraInformation();
      angular.forEach(extra_infos, function(value, key) {
        if (
          value &&
          lists.extra_info[
            lists.profiles[settings.profile.type].subgroup
          ].indexOf(key) >= 0
        )
          payload.extra_info.push(key);
      });
      payload.extra_info = payload.extra_info.join("|");
      if (payload.extra_info.length == 0) delete payload.extra_info;
      return payload;
    };
    /**
     * generates object for request and serializes it to http parameters
     * @param {String} str: Free form address
     * @param {boolean} reverse: if reversed geocoding, default false
     * @param {string} language: Desired language of response
     * @param {number} limit: To limit the amount of responses
     * @return {Object} payload: Paylod object used in xhr request
     */
    orsUtilsService.geocodingPayload = function(
      obj,
      reverse = false,
      language = "en-US",
      limit = 5
    ) {
      let payload;
      let orsSettingsFactory = $injector.get("orsSettingsFactory");
      if (!reverse) {
        payload = {
          text: obj,
          lang: language,
          size: limit,
          "focus.point.lat": orsSettingsFactory.getUserOptions().lat,
          "focus.point.lon": orsSettingsFactory.getUserOptions().lng
        };
      } else {
        payload = {
          "point.lat": obj.split(", ")[1],
          "point.lon": obj.split(", ")[0],
          // location: obj,
          lang: language,
          size: 1
        };
      }
      return payload;
    };
    orsUtilsService.generateOptions = settings => {
      const subgroup = lists.profiles[settings.profile.type].subgroup;
      let options = {
        avoid_features: "",
        avoid_borders: "",
        avoid_countries: "",
        profile_params: {
          weightings: {},
          restrictions: {}
        }
      };
      angular.forEach(settings.profile.options.avoidables, function(
        value,
        key
      ) {
        if (value === true) {
          const avSubgroups = lists.optionList.avoidables[key].subgroups;
          if (avSubgroups.indexOf(subgroup) !== -1) {
            options.avoid_features +=
              lists.optionList.avoidables[key].name + "|";
          }
        }
      });
      if (subgroup === "Bicycle") {
        if (!angular.isUndefined(settings.profile.options.difficulty)) {
          if (settings.profile.options.difficulty.avoidhills === true)
            options.avoid_features += "hills" + "|";
        }
      }
      if (options.avoid_features.length === 0) {
        delete options.avoid_features;
      } else {
        options.avoid_features = options.avoid_features.slice(0, -1);
      }
      if (subgroup === "Car" || subgroup === "HeavyVehicle") {
        if (!angular.isUndefined(settings.profile.options.borders)) {
          let borders = settings.profile.options.borders;
          // if all borders are avoided only pass avoid_borders="all"
          if (borders.all) {
            options.avoid_borders = "all";
          } else {
            // otherwise check for controlled borders and countries
            options.avoid_borders = borders.controlled ? "controlled" : "";
            options.avoid_countries = borders.country;
            if (!angular.isUndefined(borders.country))
              options.avoid_countries = borders.country;
          }
        }
      }
      // remove if empty
      if (angular.equals(options.avoid_borders, ""))
        delete options.avoid_borders;
      if (angular.equals(options.avoid_countries, ""))
        delete options.avoid_countries;
      if (subgroup === "HeavyVehicle") {
        let vt = 0;
        if (!angular.isUndefined(settings.profile.options.width)) {
          options.profile_params.restrictions.width = settings.profile.options.width.toString();
          ++vt;
        }
        if (!angular.isUndefined(settings.profile.options.height)) {
          options.profile_params.restrictions.height = settings.profile.options.height.toString();
          ++vt;
        }
        if (!angular.isUndefined(settings.profile.options.hgvWeight)) {
          options.profile_params.restrictions.weight = settings.profile.options.hgvWeight.toString();
          ++vt;
        }
        if (!angular.isUndefined(settings.profile.options.length)) {
          options.profile_params.restrictions.length = settings.profile.options.length.toString();
          ++vt;
        }
        if (!angular.isUndefined(settings.profile.options.axleload)) {
          options.profile_params.restrictions.axleload = settings.profile.options.axleload.toString();
          ++vt;
        }
        if (
          !angular.isUndefined(settings.profile.options.hazmat) &&
          settings.profile.options.hazmat
        ) {
          options.profile_params.restrictions.hazmat =
            settings.profile.options.hazmat;
          ++vt;
        }
        if (vt !== 0) options.vehicle_type = settings.profile.type;
      }
      if (settings.profile.options.maxspeed)
        options.maximum_speed = settings.profile.options.maxspeed.toString();
      if (subgroup === "Bicycle") {
        if (
          (settings.profile.options.steepness > 0) &
          (settings.profile.options.steepness <= 15)
        ) {
          options.profile_params.restrictions.gradient = settings.profile.options.steepness.toString();
        }
        if (
          (settings.profile.options.fitness >= 0) &
          (settings.profile.options.fitness <= 3)
        ) {
          options.profile_params.weightings.steepness_difficulty = {
            level: settings.profile.options.fitness.toString()
          };
        }
      }
      if (subgroup === "Pedestrian") {
        if (settings.profile.options.green) {
          options.profile_params.weightings.green = {
            factor: settings.profile.options.green
          };
        }
        if (settings.profile.options.quiet) {
          options.profile_params.weightings.quiet = {
            factor: settings.profile.options.quiet
          };
        }
      }
      // if avoid area polygon
      if (
        settings.avoidable_polygons &&
        settings.avoidable_polygons.coordinates.length > 0
      ) {
        options.avoid_polygons = settings.avoidable_polygons;
      }
      if (subgroup === "Wheelchair") {
        if (settings.profile.options.surface)
          options.profile_params.restrictions.surface_type = settings.profile.options.surface.toString();
        //options.profile_params.track_type = '';
        //options.profile_params.smoothness_type = '';
        if (settings.profile.options.curb)
          options.profile_params.restrictions.maximum_sloped_kerb = settings.profile.options.curb.toString();
        if (settings.profile.options.incline)
          options.profile_params.restrictions.maximum_incline = settings.profile.options.incline.toString();
        if (settings.profile.options.wheelchairWidth)
          options.profile_params.restrictions.minimum_width = settings.profile.options.wheelchairWidth.toString();
      }
      if (angular.equals(options.profile_params.weightings, {}))
        delete options.profile_params.weightings;
      if (angular.equals(options.profile_params.restrictions, {}))
        delete options.profile_params.restrictions;
      if (angular.equals(options.profile_params, {}))
        delete options.profile_params;
      // removes 'undefined' keys from JSON Object
      return JSON.parse(JSON.stringify(options));
    };
    /**
     * generates object for request and serializes it to http parameters
     * @param {Object} settings: Settings object for payload
     * @return {Object} payload: Paylod object used in xhr request
     */
    orsUtilsService.isochronesPayload = function(settings) {
      let payload;
      payload = {
        format: "json",
        locations:
          orsUtilsService.roundCoordinate(settings.waypoints[0]._latlng.lng) +
          "," +
          orsUtilsService.roundCoordinate(settings.waypoints[0]._latlng.lat),
        // this will suppress the jshint error for linebreak before ternary
        /*jshint -W014 */
        range_type:
          parseInt(settings.profile.options.analysis_options.method) === 0
            ? "time"
            : "distance",
        range:
          parseInt(settings.profile.options.analysis_options.method) === 0
            ? settings.profile.options.analysis_options.isovalue * 60
            : settings.profile.options.analysis_options.isovalue * 1000,
        interval:
          parseInt(settings.profile.options.analysis_options.method) === 0
            ? settings.profile.options.analysis_options.isointerval * 60
            : settings.profile.options.analysis_options.isointerval * 1000,
        location_type:
          settings.profile.options.analysis_options.reverseflow === true
            ? lists.isochroneOptionList.reverseFlow.destination
            : lists.isochroneOptionList.reverseFlow.start,
        /*jshint +W014 */
        profile: lists.profiles[settings.profile.type].request,
        attributes: "area|reachfactor|total_pop",
        options: JSON.stringify(orsUtilsService.generateOptions(settings))
      };
      // remove options if empty
      if (payload.options.length == 2) delete payload.options;
      // if avoid area polygon
      if (
        settings.avoidable_polygons &&
        settings.avoidable_polygons.coordinates.length > 0
      ) {
        payload.options.avoid_polygons = settings.avoidable_polygons;
      }
      return payload;
    };
    /**
     * generates object for request and serializes it to http parameters
     * @param {Object} settings: Settings object for payload
     * @return {Object} payload: Paylod object used in xhr request
     */
    orsUtilsService.locationsCategoryPayload = () => {
      let payload;
      payload = {
        request: "list"
      };
      return payload;
    };
    /**
     * generates object for request and serializes it to http parameters
     * @param {Object} settings: Settings object for payload
     * @return {Object} payload: Paylod object used in xhr request
     */
    orsUtilsService.locationsPayload = settings => {
      let payload;
      payload = {
        request: "pois",
        geometry: {
          bbox: settings.bbox
        },
        limit: 2000,
        filters: {}

        //limit: 200,
        //details: 'address|contact|attributes'
      };
      //if (settings.nameFilter) payload.name = settings.nameFilter;
      if (settings.categories.length > 0)
        payload.filters.category_group_ids = settings.categories.map(Number);
      if (settings.subCategories.length > 0)
        payload.filters.category_ids = settings.subCategories.map(Number);
      return payload;
    };
    orsUtilsService.addShortAddresses = function(features) {
      angular.forEach(features, function(feature) {
        const properties = feature.properties;
        feature.processed = {};
        // primary information
        if (
          "name" in properties &&
          properties.name.indexOf(properties.street) == -1 &&
          properties.name !== properties.street
        ) {
          feature.processed.primary = properties.name;
          if ("street" in properties) {
            feature.processed.primary += ", " + properties.street;
            if ("housenumber" in properties) {
              feature.processed.primary += " " + properties.housenumber;
            }
          }
        } else if ("street" in properties) {
          const streetAddress = [];
          // street and name can be the same, just needed once
          streetAddress.push(properties.street);
          if ("housenumber" in properties) {
            streetAddress.push(properties.housenumber);
          }
          // street address with house number can also be the same as name
          if (streetAddress.length > 0) {
            feature.processed.primary = streetAddress.join(" ");
          }
        } else if ("locality" in properties) {
          feature.processed.primary = properties.locality;
        }
        // secondary information
        const secondary = [];
        if ("postalcode" in properties) {
          secondary.push(properties.postalcode);
        }
        if ("neighbourhood" in properties) {
          secondary.push(properties.neighbourhood);
        }
        if ("borough" in properties) {
          secondary.push(properties.borough);
        }
        if (
          "locality" in properties &&
          properties.locality !== properties.name
        ) {
          secondary.push(properties.locality);
        }
        if (
          "municipality" in properties &&
          properties.municipality !== properties.name &&
          properties.municipality !== properties.locality
        ) {
          secondary.push(properties.municipality);
        }
        if (
          "county" in properties &&
          properties.county !== properties.name &&
          properties.county !== properties.locality
        ) {
          secondary.push(properties.county);
        }
        if ("region" in properties && properties.region !== properties.name) {
          secondary.push(properties.region);
        }
        if ("country" in properties && properties.country !== properties.name) {
          secondary.push(properties.country);
        }
        if (secondary.length <= 1 && properties.country !== properties.name)
          secondary.push(properties.country);
        feature.processed.secondary = secondary.join(", ");
        feature.processed.place_type = properties.layer;
      });
      return features;
    };
    /**
     * Calls the Javascript functions getElementsByTagNameNS
     * @param element: XML element to retrieve the information from
     * @param ns: Namespace to operate in
     * @param tagName: attribute name of the child elements to return
     * @param collection: if a collection of features is to be returned
     * @return suitable elements of the given input element that match the tagName
     */
    orsUtilsService.getElementsByTagNameNS = function(
      element,
      ns,
      tagName,
      collection
    ) {
      if (element.getElementsByTagNameNS) {
        if (collection) {
          let collectionArr = [];
          collectionArr.push(element.getElementsByTagNameNS(ns, tagName));
          return collectionArr;
        }
        return element.getElementsByTagNameNS(ns, tagName);
      }
    };
    /**
     * convert a distance to an easy to read format.
     * @param distance: a number
     * @param uom: distance unit; one of m/yd
     */
    orsUtilsService.convertDistanceFormat = function(distance, uom) {
      uom = uom.toLowerCase();
      const origDistance = parseFloat(distance);
      distance = parseFloat(distance);
      if (distance >= 1000) {
        uom = "km";
        distance = distance / 1000;
        distance = orsUtilsService.round(distance);
      } else {
        uom = "m";
      }
      distance = orsUtilsService.round(distance);
      return [origDistance, distance, uom];
    };
    /**
     * positions are often set as data-attributes in the Ui/ HTML file. Converts them to OpenLayers.LonLat position
     * @param positionString: String containing the coordinates
     * @return: OpenLayers.LonLat with these coordinates
     */
    orsUtilsService.convertPositionStringToLonLat = function(positionString) {
      var pos = positionString.split(" ");
      pos = L.latLng(pos[1], pos[0]);
      return pos;
    };
    /**
     * rounds a given distance to an appropriate number of digits
     * @distance: number to round
     */
    orsUtilsService.round = function(distance) {
      //precision - set the number of fractional digits to round to
      var precision = 4;
      if (distance < 0.3) {
        precision = 3;
      }
      if (distance >= 0.3) {
        precision = 2;
      }
      if (distance > 2) {
        precision = 1;
      }
      if (distance > 100) {
        precision = 0;
      }
      if (distance > 300) {
        precision = -1;
      }
      if (distance > 2000) {
        precision = -2;
      }
      var p = Math.pow(10, precision);
      return Math.round(distance * p) / p;
    };
    /**
     * generates a string of current settings to be used in permalink
     * @settings: route/analysis settings
     * @useroptions: useroptions
     */
    orsUtilsService.parseSettingsToPermalink = (settings, userOptions) => {
      //console.info("parseSettingsToPermalink", settings, userOptions);
      if (settings.profile === undefined) return;
      let link = "";
      if (userOptions.lat && userOptions.lng) {
        link +=
          lists.permalinkKeys.lat +
          "=" +
          orsUtilsService.roundCoordinate(userOptions.lat) +
          "&";
        link +=
          lists.permalinkKeys.lng +
          "=" +
          orsUtilsService.roundCoordinate(userOptions.lng) +
          "&";
      }
      if (userOptions.zoom) {
        link += lists.permalinkKeys.zoom + "=" + userOptions.zoom + "&";
      }
      // Hack to remove angular properties that do not have to be saved
      let profile = angular.fromJson(angular.toJson(settings.profile));
      let waypoints = angular.fromJson(angular.toJson(settings.waypoints));

      function getProp(obj) {
        for (let o in obj) {
          if (typeof obj[o] == "object") {
            getProp(obj[o]);
          } else {
            // check for borders first or country value will get caught by Filter functions
            if (lists.optionList.borders[o]) {
              if (
                lists.optionList.borders[o].subgroups.includes(
                  lists.profiles[settings.profile.type].subgroup
                )
              ) {
                // converts the pipes to commas to keep permalink clean
                if (o == "country") {
                  if (obj[o] !== "") {
                    let c = obj[o].replace(/\|/g, ",");
                    link += "&" + lists.permalinkKeys[o] + "=" + c;
                  }
                } else {
                  if (obj[o] === true) {
                    link += "&" + lists.permalinkKeys[o] + "=1";
                  } else if (obj[o] === false) {
                  } else {
                    link += "&" + lists.permalinkKeys[o] + "=" + obj[o];
                  }
                }
              }
              // Filter functions and properties of other types
            } else if (
              typeof obj[o] !== "function" &&
              o.toString().charAt(0) !== "_" &&
              (lists.permalinkFilters[settings.profile.type].includes(o) ||
                lists.permalinkFilters.analysis.includes(o))
            ) {
              if (obj[o] in lists.profiles) {
                link +=
                  "&" +
                  lists.permalinkKeys[o] +
                  "=" +
                  lists.profiles[obj[o]].shortValue;
              } else if (obj[o] in lists.optionList.weight) {
                link +=
                  "&" +
                  lists.permalinkKeys[o] +
                  "=" +
                  lists.optionList.weight[obj[o]].shortValue;
              } else if (obj[o] === true) {
                link += "&" + lists.permalinkKeys[o] + "=1";
              } else if (obj[o] === false) {
              } else {
                link += "&" + lists.permalinkKeys[o] + "=" + obj[o];
              }
            }
            if (lists.optionList.avoidables[o]) {
              if (
                lists.optionList.avoidables[o].subgroups.includes(
                  settings.profile.type
                )
              ) {
                if (obj[o] === true) {
                  link += "&" + lists.permalinkKeys[o] + "=1";
                } else if (obj[o] === false) {
                } else {
                  link += "&" + lists.permalinkKeys[o] + "=" + obj[o];
                }
              }
            }
          }
        }
      }
      let latLngs = [],
        waypointsSet = false;
      for (let waypoint of waypoints) {
        let lat, lng;
        if (
          typeof waypoint._latlng.lat === "number" &&
          typeof waypoint._latlng.lng === "number"
        ) {
          lat = Math.round(waypoint._latlng.lat * 1000000) / 1000000;
          lng = Math.round(waypoint._latlng.lng * 1000000) / 1000000;
          waypointsSet = true;
        } else {
          lat = lng = "null";
        }
        latLngs.push(lat);
        latLngs.push(lng);
      }
      if (waypointsSet)
        link += lists.permalinkKeys.wps + "=" + latLngs.join(",");
      getProp(profile);
      if (userOptions.routinglang !== undefined)
        link +=
          "&" + lists.permalinkKeys.routinglang + "=" + userOptions.routinglang;
      if (userOptions.units !== undefined)
        link += "&" + lists.permalinkKeys.units + "=" + userOptions.units;
      // This timeout is neccessariliy needed to update the permalink on router reuse !!!
      $timeout(function() {
        $location.search(link);
      });
    };
    return orsUtilsService;
  }
]);
