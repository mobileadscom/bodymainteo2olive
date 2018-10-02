import axios from 'axios';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import firebaseConfig from './firebaseConfig';
import Fingerprint2 from 'fingerprintjs2';

firebase.initializeApp(firebaseConfig);

var domain = 'https://www.mobileads.com';
var apiDomain = 'https://api.mobileads.com';

var userCollection = 'BodyMainteUsers';
var couponCollection = 'BodyMainteCoupons';
var functionsDomain = 'https://us-central1-bodymainteo2o-1366e.cloudfunctions.net/twitter';

var localStorageName = 'BodyMainte';

var campaignId = 'ca8ca8c34a363fa07b2d38d007ca55c6';
var adUserId = '4441';
var rmaId = '1';
var generalUrl = 'https://track.richmediaads.com/a/analytic.htm?rmaId={{rmaId}}&domainId=0&pageLoadId={{cb}}&userId={{adUserId}}&pubUserId=0&campaignId={{campaignId}}&callback=trackSuccess&type={{type}}&value={{value}}&uniqueId={{userId}}&customId={{source}}';

var trackingUrl = generalUrl.replace('{{rmaId}}', rmaId).replace('{{campaignId}}', campaignId).replace('{{adUserId}}', adUserId).replace('{{cb}}', Date.now().toString());

var user = {
	isWanderer: false,
	twitter: {
		token: '',
		secret: ''
	},
	info: {
		answers: [],
		couponCode: '',
		id: '',
		noQuestionAnswered: 0,
		state: '-',
		source: '',
	},
	fingerprint:'',
	generateFingerPrint() {
		new Fingerprint2().get((result, components) => {
			this.fingerprint = result;
	        return result;
        });
	},
	get: function(userId, source) {
		/* this is using the old mysql database. Not using Now */
    return axios.get(apiDomain + '/coupons/o2o/user_info', {
      params: {
        id: userId,
        source: source
      }
    });
	},
	register: function(userId, source) {
		// var regForm = new FormData();
		// regForm.append('id', userId);
		// return axios.post(apiDomain + '/coupons/user_register', regForm, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

		return axios.post(apiDomain + '/coupons/o2o/user_register?id=' + userId + '&source=' + source + '&fingerprint=' + this.fingerprint);
	},
	trackRegister: function(userId, source) {
    // track as impression
    if (window.location.hostname.indexOf('localhost') < 0) {
	    var type = 'page_view';
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', '').replace('{{userId}}', userId).replace('{{source}}', source);
			return axios.get(url);
    }
	},
	sendEmail: function(email, subjectTitle, content) {
  	var formData = new FormData();
    formData.append('sender', 'Couponcampaign.ienomistyle.com');
    formData.append('subject', subjectTitle);
    formData.append('recipient', email);
    formData.append('content', content);
    axios.post(domain + '/mail/send', formData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).then(function(resp) {
      console.log(resp);
    }).catch(function(error) {
      console.log(error);
    });
	},
	registerTwitter: function() {
		console.log('registerTwitter');
		var provider = new firebase.auth.TwitterAuthProvider();
	  return firebase.auth().signInWithPopup(provider);
	},
	isFollowingTwitter: function() {
		return axios.post(functionsDomain + '/checkFriendship', {
      token: this.twitter.token,
      tokenSecret: this.twitter.secret,
      id: this.info.id
	  });
	},
	followTwitter: function() {
		return axios.post(functionsDomain + '/followUs', {
      token: this.twitter.token,
      tokenSecret: this.twitter.secret
    });
	},
	messageTwitter: function(message) {
		return axios.post(functionsDomain + '/sendMessage', {
      token: this.twitter.token,
      tokenSecret: this.twitter.secret,
      recipientId: this.info.id,
      text: message
     });
	},
	saveAnswer: function(userId, answer) {
		/* this is using the old mysql database. Not using Now */
		/*var ansForm = new FormData();
    ansForm.append('id', userId);
    ansForm.append('questionNo', questionNo);
    ansForm.append('answer', answer)
    return axios.post(domain + '/api/coupon/softbank/user_answer_save', ansForm, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });*/

    /* mongoDB */
    var userQuery = JSON.stringify({
			id: userId
		});

		var updateAnswer = JSON.stringify({
			Answers: answer,
			noQuestionAnswered: answer.length - 1
		});
    axios.post('https://api.mobileads.com/mgd/updOne?col=' + userCollection + '&qobj=' + encodeURIComponent(userQuery) + '&uobj=' + encodeURIComponent(updateAnswer))
    .then((response) => {
			if (response.data.status == 'success') {
				console.log('answers saved to database');
			}
    }).catch((error) => {
			console.error(error);
    });
	},
	trackAnswer: function(userId, questionNo, answer, source) {
		if (window.location.hostname.indexOf('localhost') < 0) {
			var type = 'q_a';
			var value = 'q' + questionNo.toString() + '_' + encodeURIComponent(answer);
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', value).replace('{{userId}}', userId).replace('{{source}}', source);
			return axios.get(url);
	  }
	},
	mark: function(userId, state, groups, source) {
		// var groupJSON = JSON.stringify(groups);
		var groupJSON = groups[0];
		return axios.post(apiDomain + '/coupons/o2o/mark_user?id=' + userId + '&state=' + state + '&group=' + groupJSON + '&source=' + source);
	},
	win: function(userId, couponInfo) {
		return new Promise(function(resolve, reject) {
			// redeem coupon
			var uQuery = JSON.stringify({
				_id: couponInfo._id
			});
			var updateCoupon = JSON.stringify({
				redeemed: true,
				owner: userId
			});

			axios.post('https://api.mobileads.com/mgd/updOne?col=FamilyMartCoupons&qobj=' + encodeURIComponent(uQuery) + '&uobj=' + encodeURIComponent(updateCoupon))
			.then((resp) => {
				if (resp.data.status == 'success') { //coupon redeemed, update user as winner
					var userQuery = JSON.stringify({
						id: userId
					});

					var updateState = JSON.stringify({
						state: 'win',
						couponCode: couponInfo.couponCode
					});

				    axios.post('https://api.mobileads.com/mgd/updOne?col=testCol2&qobj=' + encodeURIComponent(userQuery) + '&uobj=' + encodeURIComponent(updateState))
				    .then((res) => {
						if (resp.data.status == 'success') {
							resolve({
								data: {
									couponCode: couponInfo.couponCode,
									message: "marked.",
									status:true
								}
							});
						}
				    }).catch((err) => {
						console.error(err);
						reject({
							data: {
								message: 'error',
								status: false
							}
						});
				    });
							
				}
				else {
					reject({
						data: {
							message: 'error',
							status: false
						}
					});
				}
			}).catch((err) => {
				console.error(error);
				reject({
					data: {
						message: 'error',
						status: false
					}
				});
		    });
		});
		// var markForm = new FormData();
  //   markForm.append('id', userId);
  //   markForm.append('state', 'win');
  //   markForm.append('couponGroup', group);
  //   markForm.append('source', source);
  //   return axios.post(domain + '/api/coupon/softbank/mark_user', markForm, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
	},
	trackWin: function(userId, couponCode) {
		// put in couponCode in value
		if (window.location.hostname.indexOf('localhost') < 0) {
			var type = 'win';
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', couponCode).replace('{{userId}}', userId).replace('{{source}}', source);
			url += '&tt=E&ty=E';
			return axios.get(url);
		}
	},
	trackLose: function(userId) {
		if (window.location.hostname.indexOf('localhost') < 0) {
			var type = 'lose';
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', '').replace('{{userId}}', userId).replace('{{source}}', source);
			url += '&tt=E&ty=E';
			return axios.get(url);
		}
	},
	lose: function(userId, source) {
		var userQuery = JSON.stringify({
			id: userId
		});
		var updateState = JSON.stringify({
			state: 'lose',
		});
		return new Promise(function(resolve, reject) {
			axios.post('https://api.mobileads.com/mgd/updOne?col=testCol2&qobj=' + encodeURIComponent(userQuery) + '&uobj=' + encodeURIComponent(updateState))
	    .then((response) => {
				if (response.data.status == 'success') {
					resolve({
						data: {
							message: "marked.",
							status:true
						}
					});
				}
				else {
					reject({
						data: {
							message: "error during mark",
							status:true
						}
					});
				}
	    }).catch((error) => {
				console.error(error);
				reject({
					data: {
						message: "error during mark",
						status:true
					}
				});
	    });
	  });
		// var markForm = new FormData();
  //   markForm.append('id', userId);
  //   markForm.append('state', 'lose');
	 //  markForm.append('source', source);
  //   return axios.post(domain + '/api/coupon/softbank/mark_user', markForm, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
	},
	passResult: function(userId, flag, source, couponLink) { // flag: 1 = win, 0 = lose
		var psForm = new FormData();
		psForm.append('user_id', userId);
		psForm.append('flag', flag);
	    psForm.append('campaign_id', 'ca8ca8c34a363fa07b2d38d007ca55c6');
		psForm.append('source', source);
		if (couponLink) {
			psForm.append('coupon_url', encodeURIComponent(couponLink));
		}
		return axios.post(domain + '/api/coupon/softbank/api_call', psForm, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
	},
	// saveLocal: function(userId, couponCode, state, source) {
	saveLocal: function(userObj, source) {
		if (window.localStorage.getItem(localStorageName)) {
			try {
				var dataObj = JSON.parse(window.localStorage.getItem(localStorageName));
				if (dataObj[source]) {
					dataObj[source] = Object.assign(userObj, {source: source, answers: dataObj[source].answers});
					window.localStorage.setItem(localStorageName, JSON.stringify(dataObj));
				}
				else {
					dataObj[source] = Object.assign(userObj, {source: source, answers: []});
					window.localStorage.setItem(localStorageName, JSON.stringify(dataObj));
				}
			}
			catch(err) {
				console.error(err);
			}
		}
		else {
			var dataObj = {};
			dataObj[source] = Object.assign(userObj, {source: source, answers: []});
			window.localStorage.setItem(localStorageName, JSON.stringify(dataObj));
		}
	},
	saveLocalAnswers:function(answers, source) {
		if (window.localStorage.getItem(localStorageName)) {
			try {
				var dataObj = JSON.parse(window.localStorage.getItem(localStorageName));
				if (dataObj[source]) {
					dataObj[source].answers = answers;
					window.localStorage.setItem(localStorageName, JSON.stringify(dataObj));
				}
			}
			catch(err) {
				console.error('error getting local user info');
			}
		}
	},
	getLocal: function(source) {
		if (window.localStorage.getItem(localStorageName)) {
			try {
				var dataObj = JSON.parse(window.localStorage.getItem(localStorageName));
				if (dataObj[source] && dataObj[source].id) {
					return {
						data: dataObj[source],
						status: true
					}
				}
				else {
					return {
						status: false
					}
				}
			}
			catch(err) {
				console.error(err);
				return {
					status: false
				}
			}
		}
		else {
			return {
				status: false
			}
		}
	},
	loadLocal: function(source) {
		if (window.localStorage.getItem(localStorageName)) {
			try {
				var dataObj = JSON.parse(window.localStorage.getItem(localStorageName));
				if (dataObj[source] && dataObj[source].id) {
					user.info.id = dataObj[source].id;
					user.info.couponCode = dataObj[source].couponCode;
					user.info.state = dataObj[source].state;
					user.info.answers = dataObj[source].answers;
					user.info.source = dataObj[source].source;
					console.log(user);
				}
			}
			catch(err) {
				console.error(err);
			}
		}
	},
	clearLocal: function(source) {
		if (window.localStorage.getItem(localStorageName)) {
			try {
				var dataObj = JSON.parse(window.localStorage.getItem(localStorageName));
				if (dataObj[source]) {
					delete dataObj[source];
					window.localStorage.setItem(localStorageName, JSON.stringify(dataObj));
				}
			}
			catch(err) {
				console.error(err);
			}
		}
	},
	clearLocalClean: function() {
		window.localStorage.removeItem(localStorageName);
	}
};

export default user;