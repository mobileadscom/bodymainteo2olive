import axios from 'axios';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import firebaseConfig from './firebaseConfig';
firebase.initializeApp(firebaseConfig);

var domain = 'https://www.mobileads.com';
// var domain = 'http://localhost:8080';
var functionsDomain = 'https://us-central1-familymarto2o.cloudfunctions.net/twitter';

// firestore
var db = firebase.firestore();
const settings = {timestampsInSnapshots: true};
db.settings(settings);

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
		Answers: '{}',
		couponLink: '',
		id: '',
		noQuestionAnswered: 0,
		state: '-'
	},
	get: function(userId) {
    /*return axios.get(domain + '/api/coupon/softbank/user_info', {
      params: {
        id: userId
      }
    });*/

    return new Promise(function(resolve, reject) {
    	var found = false;
    	var userObject = {};
			db.collection("users").get().then((querySnapshot) => {
		    querySnapshot.forEach((doc) => {
		      if (doc.data().id == userId) {
		      	found = true;
		      	userObject = doc.data();
		      }
		    });
				
				if (found) {
					resolve({
						data: {
							message: "retrieved.",
							user: userObject,
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
		  });
    });
    /*return new Promise(function(resolve, reject) {
			var localUser = [];
			if (typeof(Storage) !== "undefined") {
				if (window.localStorage.localUser) {
					localUser = JSON.parse(window.localStorage.localUser);
				}
				else {
					window.localStorage.localUser = JSON.stringify(localUser);
				}
				
				var found = false;
				for (var u = 0; u < localUser.length; u++) {
					if (localUser[u].id == userId) {
						found = true;
						resolve({
							data: {
								message: "retrieved.",
								user:{
									couponLink: localUser[u].couponLink,
									Answers: localUser[u].Answers,
									noQuestionAnswered: localUser[u].noQuestionAnswered,
									id: localUser[u].id,
									state: localUser[u].state
								},
								status: true
							}
						});
					}
				}

				if (!found) {
					resolve({
						data: {
							message: "not registered.",
							status: false
						}
					});
				}
			}
			else {
				reject({
					data: {
						message: 'error',
						status: false
					}
				})
			}
    });*/
	},
	register: function(userId) {
		// var regForm = new FormData();
  //   regForm.append('id', userId);
  //   return axios.post(domain + '/api/coupon/softbank/register', regForm, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
			
		return new Promise(function(resolve, reject) {
			var isRegistered = false;
			var userObject = {};
			db.collection("users").get().then((querySnapshot) => {
		    querySnapshot.forEach((doc) => {
		      if (doc.data().id == userId) {
		      	isRegistered = true;
		      	userObject = doc.data();
		      }
		    });

				if (!isRegistered) {
					db.collection('users').add({
						id: userId,
						couponLink: '',
						Answers: '{}',
						noQuestionAnswered: 0,
						state: '-'
					}).then((docRef) => {
				    resolve({
							data: {
								message: "registration success.",
								status: true
							}
						});
					})
					.catch((error) => {
						reject({
							data: {
								message: 'error',
								status: false
							}
						});
					});
				}
				else {
					resolve({
						data: {
							message: "user exist.",
							user: userObject,
							status: false
						}
					});
				}
			});
		});



		/*return new Promise(function(resolve, reject) {
			var localUser = [];
			if (typeof(Storage) !== "undefined") {
				if (window.localStorage.localUser) {
					localUser = JSON.parse(window.localStorage.localUser);
				}
				else {
					window.localStorage.localUser = JSON.stringify(localUser);
				}
				var found = false;
				for (var u = 0; u < localUser.length; u++) {
					if (localUser[u].id == userId) {
						found = true;
						resolve({
							data: {
								message: "user exist.",
								status: false
							}
						});
					}
				}
				
				if (!found) {
					localUser.push({
						id: userId,
						couponLink: '',
						Answers: '{}',
						noQuestionAnswered: 0,
						state: '-'
					});
					var userJson = JSON.stringify(localUser);
					window.localStorage.localUser = userJson;
				  resolve({
						data: {
							message: "registration success.",
							status: true
						}
					});
				}
		  }
		  else {
				reject({
					data: {
						message: 'error',
						status: false
					}
				});
		  }   	
    });*/
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
    formData.append('sender', 'Coupooncampaign.ienomistyle.com');
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
	saveAnswer: function(userId, questionNo, answer) {
		var ansForm = new FormData();
    ansForm.append('id', userId);
    ansForm.append('questionNo', questionNo);
    ansForm.append('answer', answer)
    return axios.post(domain + '/api/coupon/softbank/user_answer_save', ansForm, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
	},
	trackAnswer: function(userId, questionNo, answer) {
		if (window.location.hostname.indexOf('localhost') < 0) {
			var type = 'q_a';
			var value = 'q' + questionNo.toString() + '_' + encodeURIComponent(answer);
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', value).replace('{{userId}}', userId);
			return axios.get(url);
	  }
	},
	win: function(userId, group, source) {
		// var markForm = new FormData();
  //   markForm.append('id', userId);
  //   markForm.append('state', 'win');
  //   markForm.append('couponGroup', group);
  //   markForm.append('source', source);
  //   return axios.post(domain + '/api/coupon/softbank/mark_user', markForm, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    
		return new Promise(function(resolve, reject) {
			var found = false;
    	var userObject = {};
    	var docId = '';
			db.collection("users").get().then((querySnapshot) => {
		    querySnapshot.forEach((doc) => {
		      if (doc.data().id == userId) {
		      	found = true;
		      	docId = doc.id;
		      	userObject = doc.data();
		      }
		    });

		    if (found) {
					db.collection("users").doc(docId).update({
					  state: 'win',
					  couponLink: 'https://rmarepo.richmediaads.com/o2o/familymart/demo/coupon.html'
					})
					.then(() => {
						 resolve({
							data: {
								couponLink: "https://rmarepo.richmediaads.com/o2o/familymart/demo/coupon.html",
								message: "marked.",
								status:true
							}
						});
					})
					.catch((error) => {
						reject({
							data: {
								message: "error during mark",
								status:true
							}
						});
					});
		    }
		    else {
		    	reject({
						data: {
							message: 'user not found',
							status: false
						}
					});
		    }
		  });
		});

    /*return new Promise(function(resolve, reject) {
			var localUser = [];
			if (typeof(Storage) !== "undefined") {
				if (window.localStorage.localUser) {
					localUser = JSON.parse(window.localStorage.localUser);
				}
				else {
					window.localStorage.localUser = JSON.stringify(localUser);
				}

				var found = false;
				for (var u = 0; u < localUser.length; u++) {
					if (localUser[u].id == userId) {
						found = true;
						localUser[u].couponLink = "https://rmarepo.richmediaads.com/o2o/familymart/demo/coupon.html";
						localUser[u].state = 'win';
						var userJson = JSON.stringify(localUser);
						window.localStorage.localUser = userJson;
						resolve({
							data: {
								couponLink: "https://rmarepo.richmediaads.com/o2o/familymart/demo/coupon.html",
								message: "marked.",
								status:true
							}
						});
					}
				}

				if (!found) {
					resolve({
						data: {
							message: "user not found!",
							status: false
						}
					})
				}
			}
			else {
				reject({
					data: {
						message: 'error',
						status: false
					}
				});
		  } 
		});*/
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
		// var markForm = new FormData();
  //   markForm.append('id', userId);
  //   markForm.append('state', 'lose');
	 //  markForm.append('source', source);
  //   return axios.post(domain + '/api/coupon/softbank/mark_user', markForm, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
		return new Promise(function(resolve, reject) {
			var found = false;
    	var userObject = {};
			var docId = '';
			db.collection("users").get().then((querySnapshot) => {
		    querySnapshot.forEach((doc) => {
		      if (doc.data().id == userId) {
		      	found = true;
		      	docId = doc.id;
		      	userObject = doc.data();
		      }
		    });

		    if (found) {
					db.collection("users").doc(docId).update({
					  state: 'lose',
					})
					.then(() => {
						 resolve({
							data: {
								message: "marked.",
								status:true
							}
						});
					})
					.catch((error) => {
						reject({
							data: {
								message: "error during mark",
								status:true
							}
						});
					});
		    }
		    else {
		    	reject({
						data: {
							message: 'user not found',
							status: false
						}
					});
		    }
		  });
		});


		/*return new Promise(function(resolve, reject) {
			var localUser = [];
			if (typeof(Storage) !== "undefined") {
				if (window.localStorage.localUser) {
					localUser = JSON.parse(window.localStorage.localUser);
				}
				else {
					window.localStorage.localUser = JSON.stringify(localUser);
				}

				var found = false;
				for (var u = 0; u < localUser.length; u++) {
					if (localUser[u].id == userId) {
						found = true;
						localUser[u].state = 'lose';
						var userJson = JSON.stringify(localUser);
						window.localStorage.localUser = userJson;
						resolve({
							data: {
								message: "marked.",
								status:true
							}
						});
					}
				}

				if (!found) {
					resolve({
						data: {
							message: "user not found!",
							status: false
						}
					})
				}
			}
			else {
				reject({
					data: {
						message: 'error',
						status: false
					}
				});
		  } 
		});*/
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