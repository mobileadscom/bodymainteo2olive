import axios from 'axios';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import firebaseConfig from './firebaseConfig';
firebase.initializeApp(firebaseConfig);

var domain = 'https://www.mobileads.com';
// var domain = 'http://localhost:8080';
var userCollection = 'testCol';
var couponCollection = 'testCoupons';
var functionsDomain = 'https://us-central1-familymarto2o.cloudfunctions.net/twitter';

var campaignId = 'ca8ca8c34a363fa07b2d38d007ca55c6';
var adUserId = '4441';
var rmaId = '1';
var generalUrl = 'https://track.richmediaads.com/a/analytic.htm?rmaId={{rmaId}}&domainId=0&pageLoadId={{cb}}&userId={{adUserId}}&pubUserId=0&campaignId={{campaignId}}&callback=trackSuccess&type={{type}}&value={{value}}&uniqueId={{userId}}';

var trackingUrl = generalUrl.replace('{{rmaId}}', rmaId).replace('{{campaignId}}', campaignId).replace('{{adUserId}}', adUserId).replace('{{cb}}', Date.now().toString());

var user = {
	isWanderer: false,
	source: '',
	twitter: {
		token: '',
		secret: ''
	},
	info: {
		Answers: '',
		couponLink: '',
		id: '',
		noQuestionAnswered: 0,
		state: '-'
	},
	get: function(userId) {
		/* this is using the old mysql database. Not using Now */
    /*return axios.get(domain + '/api/coupon/softbank/user_info', {
      params: {
        id: userId
      }
    });*/

    /* mongoDB */
    return new Promise(function(resolve, reject) {
    	var userQuery = JSON.stringify({
				id: userId
			});
			axios.get('https://api.mobileads.com/mgd/q?col=' + userCollection + '&qobj=' + encodeURIComponent(userQuery))
			.then((response) => {
				if (response.data.length > 0) { //user already exist
					resolve({
						data: {
							message: "retrieved.",
							user: response.data[0],
							status: true
						}
					});
				}
				else {
					resolve({
						data: {
							message: "not registered.",
							status: false
						}
					});
				}
			}).catch((error) => {
				console.error(error);
				reject({
					data: {
						message: 'error',
						status: false
					}
				});
			});
    });
	},
	register: function(userId) {
		/* this is using the old mysql database. Not using Now */
		/*var regForm = new FormData();
		regForm.append('id', userId);
		return axios.post(domain + '/api/coupon/softbank/register', regForm, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });*/

		/* mongoDB */
		return new Promise(function(resolve, reject) {
			var userQuery = JSON.stringify({
				id: userId
			});
			axios.get('https://api.mobileads.com/mgd/q?col=' + userCollection + '&qobj=' + encodeURIComponent(userQuery))
			.then((response) => {
				if (response.data.length > 0) { //user already exist
					resolve({
						data: {
							message: "user exist.",
							user: response.data[0],
							status: false
						}
					});
				}
				else {
					var userJson = JSON.stringify({
						id: userId,
						couponLink: '',
						Answers: '[]',
						noQuestionAnswered: 0,
						state: '-'
					});
					axios.post('https://api.mobileads.com/mgd/insOne?col=' + userCollection + '&obj=' + encodeURIComponent(userJson))
					.then((resp) => {
						resolve({
							data: {
								message: "registration success.",
								status: true
							}
						});
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
			}).catch((error) => {
				console.error(error);
				reject({
					data: {
						message: 'error',
						status: false
					}
				});
			});
		});
	},
	trackRegister: function(userId) {
    // track as impression
    if (window.location.hostname.indexOf('localhost') < 0) {
	    var type = 'page_view';
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', '').replace('{{userId}}', userId);
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
		return axios.post(functionsDomain + '/getUser', {
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
	trackAnswer: function(userId, questionNo, answer) {
		if (window.location.hostname.indexOf('localhost') < 0) {
			var type = 'q_a';
			var value = 'q' + questionNo.toString() + '_' + encodeURIComponent(answer);
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', value).replace('{{userId}}', userId);
			return axios.get(url);
	  }
	},
	win: function(userId, group, source, couponInfo) {
		return new Promise(function(resolve, reject) {
			// redeem coupon
			var uQuery = JSON.stringify({
				_id: couponInfo.couponId
			});
			var updateCoupon = JSON.stringify({
				redeemed: true,
				owner: userId
			});

			axios.post('https://api.mobileads.com/mgd/updOne?col=' + couponCollection + '&qobj=' + encodeURIComponent(uQuery) + '&uobj=' + encodeURIComponent(updateCoupon))
			.then((resp) => {
				if (resp.data.status == 'success') { //coupon redeemed, update user as winner
					var userQuery = JSON.stringify({
						id: userId
					});

					var updateState = JSON.stringify({
						state: 'win',
						couponLink: couponInfo.couponLink
					});

				    axios.post('https://api.mobileads.com/mgd/updOne?col=' + userCollection + '&qobj=' + encodeURIComponent(userQuery) + '&uobj=' + encodeURIComponent(updateState))
				    .then((res) => {
						if (resp.data.status == 'success') {
							resolve({
								data: {
									couponLink: couponInfo.couponLink,
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
	trackWin: function(userId) {
		if (window.location.hostname.indexOf('localhost') < 0) {
			var type = 'win';
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', '').replace('{{userId}}', userId);
			url += '&tt=E&ty=E';
			return axios.get(url);
		}
	},
	trackLose: function(userId) {
		if (window.location.hostname.indexOf('localhost') < 0) {
			var type = 'lose';
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', '').replace('{{userId}}', userId);
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
			axios.post('https://api.mobileads.com/mgd/updOne?col=' + userCollection + '&qobj=' + encodeURIComponent(userQuery) + '&uobj=' + encodeURIComponent(updateState))
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
	saveLocal: function(userId, couponLink, state) {
		window.localStorage.setItem('localUser', userId);
		window.localStorage.setItem('localCoupon', couponLink);
		window.localStorage.setItem('localState', state);
	},
	loadLocal: function() {
		if (window.localStorage.getItem('localUser')) {
			user.info.id = window.localStorage.getItem('localUser');
			user.info.couponLink = window.localStorage.getItem('localCoupon');
			user.info.state = window.localStorage.getItem('localState');
		}
	},
	clearLocal: function() {
		window.localStorage.removeItem('localUser');
		window.localStorage.removeItem('localCoupon');
		window.localStorage.removeItem('localState');	
		window.localStorage.removeItem('localAnswers');	
	}
};

export default user;