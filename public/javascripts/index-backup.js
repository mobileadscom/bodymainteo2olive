import miniPages from './miniPages';
import {singleAnswerQuestion, multipleAnswerQuestion, dropdownQuestion} from './questions';
import miniSelect from './miniSelect';
import modal from './modal';
import {winningLogic, coupon} from './winningLogic';
import user from './user';
import '../stylesheets/miniSelect.css';
import '../stylesheets/style.css';
import '../stylesheets/miniCheckbox.css';
import '../stylesheets/modal.css';
import '../stylesheets/regForm.css';

import axios from 'axios';
var app = {
	pages: null, // array of pages
	params: {}, // params in query string
	q: [], // array of questions
	player: null, //youtube player
	getParams: function() {
		  var query_string = {};
		  var query = window.location.search.substring(1);
		  var vars = query.split("&");
		  for (var i=0;i<vars.length;i++) {
		      var pair = vars[i].split("=");
		      // If first entry with this name
		      if (typeof query_string[pair[0]] === "undefined") {
		          query_string[pair[0]] = pair[1];
		      // If second entry with this name
		      } else if (typeof query_string[pair[0]] === "string") {
		          var arr = [ query_string[pair[0]], pair[1] ];
		          query_string[pair[0]] = arr;
		      // If third or later entry with this name
		      } else {
		          query_string[pair[0]].push(pair[1]);
		      }
		  } 
		  return query_string;
	},
	initResult(state, couponLink) {
		if (state == 'win') {
			document.getElementById('resultTitle').innerHTML = "おめでとうございます！";
			document.getElementById('resultTitle').style.color = '#0193DD';
			document.getElementById('resultDescription').innerHTML = "サラダスムージーが当たりました。";
			if (user.isWanderer) {
				document.getElementById('couponLink').style.display = 'none';
				document.getElementById('resultInstruction').style.display = 'none;'
				document.getElementById('couponInfo').style.display = 'none';
			}
			else {
				document.getElementById('resultInstruction').innerHTML = "クーポンを受け取って、ファミリーマートで引き換えてください";
			}

			if (couponLink) {
				document.getElementById('couponLoader').style.display = 'none';
				document.getElementById('couponLink').href = couponLink;
				document.getElementById('couponLink').setAttribute('target', '_blank');
				 document.getElementById('getCoupon').innerText = 'クーポンを受け取る';
			}
		}
		else {
			document.getElementById('resultTitle').innerHTML = "残念！";
			document.getElementById('resultTitle').style.color = 'red';
			document.getElementById('resultDescription').innerHTML = 'はずれ';
			document.getElementById('resultInstruction').innerHTML = 'ご参加頂きありがとうございました。';
			document.getElementById('resultImage').style.display = 'none';
			document.getElementById('couponLink').style.display = 'none';
			document.getElementById('couponInfo').style.display = 'none';
		}
	},
	processResult() {
		winningLogic.process(this.q, !user.isWanderer).then((resultProperties) => {
			console.log(resultProperties);
			var state = resultProperties.trackingResult;
			var actualResult = resultProperties.actualResult;
			var group = resultProperties.group;
			var flag = resultProperties.flag;
			var couponInfo = resultProperties.couponInfo;

			if (!user.isWanderer) {
				if (actualResult == 'win') {
					user.win(user.info.id, group, user.source, couponInfo).then((response) => {
						console.log(response);
						if (response.data.couponLink) {
							user.saveLocal(user.info.id, response.data.couponLink, 'win');
							this.initResult('win', response.data.couponLink);
							var message = 'サラダスムージークーポンが当たりました! ' + encodeURI(response.data.couponLink);

							if (user.info.id.indexOf('@') > -1) { // login via email
			        	var emailContent = '<head><meta charset="utf-8"></head><div style="text-align:center;font-weight:600;color:#FF4244;font-size:28px;">おめでとうございます</div><br><br><div style="text-align:center;font-weight:600;">クーポンが当たりました！</div><a href="' + response.data.couponLink + '" target="_blank" style="text-decoration:none;"><button style="display:block;margin:20px auto;margin-bottom:40px;border-radius:5px;background-color:#E54C3C;border:none;color:white;width:200px;height:50px;font-weight:600;">クーポンを受取る</button></a>';
		        	  user.sendEmail(user.info.id, 'Ienomistyle クーポンキャンペーン', emailContent);
							}
							else {
								user.messageTwitter(message);
							}
							// user.passResult(user.info.id, flag, user.source, couponInfo.couponLink);
						}
						else {
							this.initResult('lose');
							user.saveLocal(user.info.id, '', 'lose');
							// user.passResult(user.info.id, flag, user.source);
						}
					}).catch((error) => {
	  				console.log(error);
		  			this.initResult('win');
	  			});
	  		}
	  		else {
	  			user.lose(user.info.id, user.source).then((response) => {
	  				console.log(response);
	  				// user.passResult(user.info.id, flag, user.source);
	  			}).catch((error) => {
	  				console.log(error);
	  			});
	  			user.saveLocal(user.info.id, '', 'lose');
	  			this.initResult('lose');
	  		}

	  		// if (state == 'win') {
	  			//track win
	  			// user.trackWin(user.info.id);
	  		// }
	  		// else {
	  			// user.trackLose(user.info.id);
	  			// track lose
	  		// }

			}
			else {
				this.initResult(state);
			}	
		});
	},
	continue: function() {
		var answerJson = '{}';
		if (localStorage.getItem('localAnswers')) {
			answerJson = localStorage.getItem('localAnswers');
		}
		var noQuestionAnswered = 0;
		// for multiple user per browser
		/*var userAnswers = [];
		var localAnswers = JSON.parse(answerJson);
		if (localAnswers) {
			if (localAnswers.hasOwnProperty(user.info.id)) {
				userAnswers = localAnswers[user.info.id];
				noQuestionAnswered = userAnswers.length - 1;
			}
		}

		if (!userAnswers) {
			userAnswers = JSON.parse(user.info.Answers);
			noQuestionAnswered = user.info.noQuestionAnswered;
		}*/
		// for multiple user per browser END

		// for single user per browser
		var userAnswers = JSON.parse(answerJson);
		if (userAnswers) {
			noQuestionAnswered = userAnswers.length - 1;
		}
		else {
			userAnswers = JSON.parse(user.info.Answers);
			noQuestionAnswered = user.info.noQuestionAnswered;
		}
		// for single user per browser END

		/*apply answer to answered question */
		for (var w = 1; w < this.q.length; w++) {
			if (userAnswers[w]) {
			  this.q[w].setAnswer(userAnswers[w]);
			}
		}

		if (user.info.state == 'win') {
			console.log(user.info);
			this.initResult('win', user.info.couponLink);
			this.pages.toPage('resultPage');
		}
		else if (user.info.state == 'lose') {
			this.initResult('lose');
			this.pages.toPage('resultPage');
		}
		else {
			if (noQuestionAnswered > 0) {
				if (noQuestionAnswered < this.q.length - 1) {
					this.pages.toPage('page' + (noQuestionAnswered + 1).toString());
				}
				else {
					this.pages.toPage('page' + (this.q.length - 1).toString());
				}
			}
			else {
				this.pages.toPage('page1');
			}
		}
	},
	events: function() {
		/* ==== Event Listeners ==== */
	  /* enabled terms agree checkbox when scrolled tnc to bottom */
	 /* var enableAgreeCheckbox = false;
	  document.getElementById('tnc').addEventListener('scroll', function(event) {
	  	if (!enableAgreeCheckbox) {
	  		var element = event.target;
		    if (element.scrollHeight - element.scrollTop < element.clientHeight + 50) {
		    	document.getElementById('startSurvey').disabled = false;*/
		      /*document.getElementById('agreeCheck').disabled = false;
		      enableAgreeCheckbox = true;*/
		 //    }
	  // 	}
	  // });
	  
	  /* enable start survey button when terms agree checkbox is checked */
	  document.getElementById('agreeCheck').onchange = function() {
	    if (this.checked) {
				document.getElementById('startSurvey').disabled = false;
	    }
	    else {
	    	document.getElementById('startSurvey').disabled = true;
	    }
	  }
	  
	  /* Finished Answering Questions, process result */
	  /*var processed = false;
	  document.getElementById('toResult').addEventListener('click', () => {
	  	if (!processed) {
	  		processed = true;
	  		this.processResult();
	  	}
	  });*/

		/* email registration */
	  var form = document.getElementById('regForm');
	  form.onsubmit = (event) => {
	    var spinner = document.getElementById('formWorking');
	    var donePage = document.getElementById('doneSec');
	    var regPage = document.getElementById('regSec');
		  form.style.display = 'none';
	    spinner.style.display = 'block';
      event.preventDefault();
      var email = document.getElementById('emailInput').value;
			user.register(email).then((response) => {
				console.log(response);
        spinner.style.display = 'none';
        if (response.data.status == true) {
        	this.formSections.toPage('doneSec');
        	var emailContent = '<head><meta charset="utf-8"></head>ご登録ありがとうございました。下記にあるリンクをクリックしてください。その後キャンペーンへの参加をお願いします<br><br><a href="https://couponcampaign.ienomistyle.com/サラダスムージー/?userId=' + email + '" target="_blank">https://couponcampaign.ienomistyle.com/サラダスムージー/?userId=' + email + '</a>';
        	user.sendEmail(email, 'Ienomistyle クーポンキャンペーン', emailContent);
        	// user.trackRegister();
        }
        else if (response.data.message == 'user exist.') {
        	user.info = response.data.user;
        	this.enableSaveAnswer();
        	this.continue();
					modal.closeAll();
        }

			}).catch((error) => {
				console.log(error);
				form.style.display = 'block';
        spinner.style.display = 'none';
			});
    };

    /* twitter registration / login */
    var twitReg = document.getElementById('regTwitter');
    twitReg.onclick = () => {
      var regLoader = document.getElementById('regWorking');
      var regButtons = document.getElementById('regButtons');
      regLoader.style.display = 'block';
      regButtons.style.display = 'none';
			user.registerTwitter().then((result) => {
        // This gives you a the Twitter OAuth 1.0 Access Token and Secret.
        // You can use these server side with your app's credentials to access the Twitter API.
        user.twitter.token = result.credential.accessToken;
        user.twitter.secret = result.credential.secret;
        var twitterId = result.additionalUserInfo.profile.id_str;
        this.initUser(twitterId, true, true);
      }).catch((error) => {
      	regLoader.style.display = 'none';
        regButtons.style.display = 'block';
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        alert(errorMessage);
        // ..
      });
    };

    var followBtn = document.getElementById('followBtn');
    followBtn.onclick = () => {
    	followBtn.style.display = 'none';
    	user.followTwitter().then((response) => {
				console.log(response);
	        if (response.data == 'followed!') {
	          var sMsg = document.getElementById('successFollow');
	          sMsg.style.display = 'block';
	          setTimeout(() => {
	            this.continue();
	          }, 2000);
	        }
    	}).catch((error) => {
				console.log(error);
				followBtn.style.display = 'block';
    	});
    }

    document.getElementById('toVideo').addEventListener('click', () => {
			setTimeout(() => {
				this.player.playVideo();
			}, 300);
    });
	  /* ==== Event Listeners End ==== */
	},
	checkTwitter: function() { // Check if user is following official page
		user.isFollowingTwitter().then((resp) => {
      console.log(resp);
      if (resp.data == 'following') {
				this.continue();
      }
      else {
		     this.pages.toPage('followPage');
      }
    }).catch((error) => {
      console.log(error);
      document.getElementById('regWorking').style.display = 'none';
      document.getElementById('regButtons').style.display = 'block';
    });
	},
	initUser: function(userId, autoRegister, isTwitter) {
		/* check if user is registered, if no, then register user, if yes, continue on where the user left off */
		user.get(userId).then((response) => {
			console.log(response);
    	if (response.data.status == false) { // user is not registered
	    	if (autoRegister) {
	    		user.register(userId).then((res) => { // auto register user
						console.log(res);
						user.isWanderer = false;
						user.info.id = userId;
						user.source = this.params.source;
						user.saveLocal(userId, '', '-'); // for single user per browser
						if (isTwitter) {
							this.checkTwitter();
						}
						else {
							this.continue();
						}
					  this.enableSaveAnswer();
					  // user.trackRegister();
	    		}).catch((err) => {
	    			user.isWanderer = true;
	    			console.log(err);
	    			this.pages.toPage('termsPage1');
	    		});
	    	}
	    	else {
	    		this.pages.toPage('termsPage1');
	    		this.enableSaveAnswer();
	    	}
    	}
    	else { // user is registered
    		user.isWanderer = false;
				user.info = response.data.user;
				if (window.localStorage.getItem('localAnswers')) { // for single user per browser
					user.loadLocal();
				}
				else {
					user.saveLocal(userId, response.data.user.couponLink, response.data.user.state); 
				}
				user.source = this.params.source;
				if (isTwitter) {
					this.checkTwitter();
				}
				else {
					this.continue();
				}
				this.enableSaveAnswer();
    	}
    }).catch((error) => {
    	user.isWanderer = true;
			console.log(error);
			this.pages.toPage('termsPage1');
    });
	},
	enableSaveAnswer: function() {
    /* Auto save answer for every questions*/
	  var saveBtns = document.getElementsByClassName('saveQuestion');
	  console.log('enableSaveAnswer');
	  for (var s = 0; s < saveBtns.length; s++ ) {
	  	saveBtns[s].addEventListener('click', (e) => {
	  		if (typeof(Storage) !== "undefined") {
	  			// for multiple user per browser
					/*var answerJson = '{}';
	  			if (localStorage.getItem('localAnswers')) {
	  				answerJson = localStorage.getItem('localAnswers');
	  			}
	  			var localAnswers = JSON.parse(answerJson); 
	  			if (!localAnswers) {
	  				localAnswers = {}; 
		  		}*/
		  		// for multiple user per browser END
			  	var qArray = [];
			  	for (var n = 1; n < this.q.length; n++) {
						if (this.q[n].selectedAnswer) {
							qArray[n] = this.q[n].selectedAnswer;
						}
			  	}
			  	// localAnswers[user.info.id] = qArray; // for multiple user per browser
			  	// localStorage.setItem('localAnswers', JSON.stringify(localAnswers)); // for multiple user per browser
			  	localStorage.setItem('localAnswers', JSON.stringify(qArray)); // for single user per browser
	  		}
	  		// var qNo = parseInt(e.target.dataset.question);
	  		// user.trackAnswer(this.params.userId, qNo, this.q[qNo].selectedAnswer);
			  // user.saveAnswer(user.info.id, qArray);
	  	})
	 }
	},
	setQuestions() {
		/* ==== Set Questions ==== */
	  this.q[1] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q1'),
	  	question: '<span class="red">QUESTION 1</span><br>スムージーを良く飲みますか？',
	  	answers: [{
	    	value: '飲んだことがある。',
	    	text: '飲んだことがある。',
	    }, {
	    	value: '飲んだことはないが、飲んでみたい。',
	    	text: '飲んだことはないが、飲んでみたい。'
	    }, {
	    	value: '飲んだことがない。',
	    	text: '飲んだことがない。'
	    }],
	    nextBtn: document.getElementById('toQ2')
	  });
	  
	  this.q[2] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q2'),
	  	question: '<span class="red">QUESTION 2</span><br>スムージーに何を期待しますか？',
	  	answers: [{
	    	value: '美味しい味。',
	    	text: '美味しい味。',
	    }, {
	    	value: '苦味。',
	    	text: '苦味。'
	    }, {
	    	value: '整腸効果。',
	    	text: '整腸効果。'
	    }, {
	    	value: 'ダイエット効果。（朝ごはんや昼ごはんの置き換え）',
	    	text: 'ダイエット効果。（朝ごはんや昼ごはんの置き換え）'
	    }, {
	    	value: '安さ',
	    	text: '安さ'
	    }],
	    nextBtn: document.getElementById('toQ3')
	  });

	  this.q[3] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q3'),
	  	question: '<span class="red">QUESTION 3</span><br>いつもどこで買い物をしますか？',
	  	answers: [{
	    	value: 'ローソン',
	    	text: 'ローソン',
	    }, {
	    	value: 'セブン・イレブン',
	    	text: 'セブン・イレブン	'
	    }, {
	    	value: 'ファミリーマート',
	    	text: 'ファミリーマート'
	    }, {
	    	value: 'ドラックストア',
	    	text: 'ドラックストア'
	    }, {
	    	value: 'その他',
	    	text: 'その他'
	    }],
	    nextBtn: document.getElementById('toApply')
	  });
	  /* ==== Questions End ==== */
	},
	start: function(delay) {
		if (!this.params.userId || !this.params.source) {
		  user.isWanderer = true;
		  var t = delay || 100;
	    setTimeout(() => {
	    	if (localStorage.getItem('localUser')) { // this browser already have user
					user.isWanderer = false;
					user.source = this.params.source;
					user.loadLocal();
					this.enableSaveAnswer();
					this.continue();
				}
				else {
			    // this.pages.toPage('regPage');
			    this.pages.toPage('termsPage1');
			  }
		  }, t);
	  }
	  else {
			if (localStorage.getItem('localUser')) { // for single user per browser
				user.loadLocal();
				this.enableSaveAnswer();
				this.continue();
			}
			else {
				this.initUser(this.params.userId, false);
			}
		}
	},
	init: function() {
		var vidWidth = document.getElementById('vid').clientWidth;
    var vidHeight = document.getElementById('vid').clientHeight;

		/* init pagination */
		this.params = this.getParams();
		this.params.source = 'source1'; // dummy source
		this.pages = new miniPages({
	  	pageWrapperClass: document.getElementById('page-wrapper'),
	  	pageClass: 'page',
	  	initialPage: document.getElementById('loadingPage'),
	  	pageButtonClass: 'pageBtn'
	  });

	  /* init registration form sections */
	  this.formSections = new miniPages({
	  	pageWrapperClass: document.getElementById('formSecWrapper'),
	  	pageClass: 'sec',
	  	initialPage: document.getElementById('regSec')
	  });
    
    this.setQuestions();
    this.events();
    /* apply mini select to <select> */
	  miniSelect.init('miniSelect');

	  /* User Info */
	  var localUser = localStorage.getItem('localUser');
		if (localUser) {
		  user.get(localUser).then((response) => {
				console.log(response);
	    	if (response.data.status == false && response.data.message != 'error') { // user is not registered
		    	user.clearLocal(); // db has been cleared, clear local storage also
	    	}
			  this.start();
	    });
		}
		else {
			this.start(1000);
		}

    /* get coupons */
		// coupon.get(this.params.source);
	  
	  var processed = false; // check if result has been processed to avoid double result processsing

		//youtube api
    var ytScript = document.createElement('script');
    ytScript.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(ytScript, firstScriptTag);
    
    window.onYouTubeIframeAPIReady = () => {
      this.player = new YT.Player('vid', {
        height: vidHeight.toString(),
        width: vidWidth.toString(),
        playerVars: {'rel': 0,'showinfo': 0, 'controls': 0, 'playsinline': 1},
        videoId: 'Hml0OM70H7E',
        events: {
          'onStateChange': (event) => {
            if (event.data == YT.PlayerState.ENDED) {
            	if (!processed) {
	            	processed = true;
	            	this.processResult();
								this.pages.toPage('resultPage');
							}
            }
          }
        }
      });
    }
	}
}

document.addEventListener('DOMContentLoaded', function() {
  app.init();
  modal.init();
  window.q = app.q;
  window.params = app.params;
    var uQuery = JSON.stringify({
        id:"892241160915238912"
      });

       // axios.post('https://api.mobileads.com/mgd/upd?col=testCoupons&qobj=' + encodeURIComponent(uQuery) + '&uobj=' + encodeURIComponent(updateCoupon))
      // axios.delete('https://api.mobileads.com/mgd/dlt?col=testCol')
      // axios.delete('https://api.mobileads.com/mgd/dltOne?col=testCol&qobj=' + encodeURIComponent(uQuery))
      axios.get('https://api.mobileads.com/mgd/q?col=testCol')
      .then((resp) => {
      	console.log(resp)
      }).catch((e) => {
      	console.log(e);
      })
});

export {
	user,
	coupon,
}