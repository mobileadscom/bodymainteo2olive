import miniPages from './miniPages';
import {singleAnswerQuestion, multipleAnswerQuestion, dropdownQuestion} from './questions';
import miniSelect from './miniSelect';
import modal from './modal';
// import {winningLogic, coupon} from './winningLogic';
import winningLogic from './winningLogic2';
import user from './user3';
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
	generateCouponLink(userId) {
		return 'https://couponcampaign.ienomistyle.com/ボディメンテドリンク/coupon.html?userId=' + userId; 
	},
	initResult(state, couponLink) {
		if (state == 'win') {
			document.getElementById('resultTitle').innerHTML = "おめでとうございます！";
			document.getElementById('resultTitle').style.color = '#0193DD';
			document.getElementById('resultDescription').innerHTML = "ボディメンテ ドリンクが当たりました。";
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
			var actualResult = resultProperties.actualResult;
			var group = resultProperties.group;
			if (!user.isWanderer) {
				user.mark(user.info.id, actualResult, group).then((response) => {
					winningLogic.processed = true;
					console.log(response)
					if (response.data.couponCode) {
						var couponLink = this.generateCouponLink(user.info.id);
						user.saveLocal(user.info.id, response.data.couponCode, 'win'); //rmb allow this back
						this.initResult('win', couponLink);
						var message = 'サラダスムージークーポンが当たりました! ' + encodeURI(couponLink);
						if (user.info.id.indexOf('@') > -1) { // login via email
				        	var emailContent = '<head><meta charset="utf-8"></head><div style="text-align:center;font-weight:600;color:#FF4244;font-size:28px;">おめでとうございます</div><br><br><div style="text-align:center;font-weight:600;">クーポンが当たりました！</div><a href="' + couponLink + '" target="_blank" style="text-decoration:none;"><button style="display:block;margin:20px auto;margin-bottom:40px;border-radius:5px;background-color:#E54C3C;border:none;color:white;width:200px;height:50px;font-weight:600;">クーポンを受取る</button></a>';
				        	 user.sendEmail(user.info.id, 'Ienomistyle クーポンキャンペーン', emailContent);
						}
						else {
							user.messageTwitter(message);
						}
						// user.passResult(user.info.id, flag, user.source, couponInfo.couponLink);
					}
					else {
						user.saveLocal(user.info.id, '', 'lose'); //rmb allow this back
						this.initResult('lose');
					}
				}).catch((error) => {
					console.log(error);
					winningLogic.processed = true;
					user.saveLocal(user.info.id, '', 'lose'); //rmb allow this back
		  			this.initResult('lose');
				});

	  		if (actualResult == 'win') {
	  			// track win
	  			// make loser
	  			// user.trackWin(user.info.id, 'lose');
	  		}
	  		else {
	  			// track lose
	  			// user.trackLose(user.info.id);
	  		}

			}
			else {
				this.initResult(actualResult);
			}	
		});
	},
	continue: function() {
		var answerJson = '{}';
		if (localStorage.getItem('bmAnswers')) {
			answerJson = localStorage.getItem('bmAnswers');
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
			this.initResult('win', this.generateCouponLink(user.info.id));
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
	  document.getElementById('toVideo').addEventListener('click', () => {
	  	if (!winningLogic.processed) {
	  		winningLogic.processed = true;
	  		this.processResult();
	  	}
	  });

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
        	var emailContent = '<head><meta charset="utf-8"></head>ご登録ありがとうございました。下記にあるリンクをクリックしてください。その後キャンペーンへの参加をお願いします<br><br><a href="https://couponcampaign.ienomistyle.com/ボディメンテドリンク/?userId=' + email + '" target="_blank">https://couponcampaign.ienomistyle.com/ボディメンテドリンク/?userId=' + email + '</a>';
        	user.sendEmail(email, 'Ienomistyle クーポンキャンペーン', emailContent);
        	// user.trackRegister(email);
        }
        else if (response.data.message == 'user exist.') {
        	user.info = response.data.user;
        	user.isWanderer = false;
        	if (window.localStorage.getItem('bmAnswers')) { // for single user per browser
						user.loadLocal();
					}
					else {
						user.saveLocal(response.data.user.id, response.data.user.couponCode, response.data.user.state); 
					}
					user.source = this.params.source;
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
					  // user.trackRegister(userId);
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
				if (window.localStorage.getItem('bmAnswers')) { // for single user per browser
					user.loadLocal();
				}
				else {
					user.saveLocal(userId, response.data.user.couponCode, response.data.user.state); 
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
			  	localStorage.setItem('bmAnswers', JSON.stringify(qArray)); // for single user per browser
	  		}
	  		var qNo = parseInt(e.target.dataset.question);
	  		// user.trackAnswer(user.info.id, qNo, this.q[qNo].selectedAnswer);
			  // user.saveAnswer(user.info.id, qArray);
	  	})
	 }
	},
	setQuestions() {
		/* ==== Set Questions ==== */
	  this.q[1] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q1'),
	  	question: '<span class="red">QUESTION 1</span><br>属性・職業について教えてください。',
	  	answers: [{
	    	value: '中学生',
	    	text: '中学生',
	    }, {
	    	value: '高校生',
	    	text: '高校生'
	    }, {
	    	value: '予備校生',
	    	text: '予備校生'
	    }, {
	    	value: '大学生',
	    	text: '大学生'
	    }, {
	    	value: '大学院生',
	    	text: '大学院生'
	    }, {
	    	value: '主婦（パート・アルバイト等兼業）',
	    	text: '主婦（パート・アルバイト等兼業）'
	    }, {
	    	value: '主婦（専業）',
	    	text: '主婦（専業）'
	    }, {
	    	value: '公務員',
	    	text: '公務員'
	    }, {
	    	value: '会社員',
	    	text: '会社員'
	    }, {
	    	value: '自営業',
	    	text: '自営業'
	    }, {
	    	value: '自由業',
	    	text: '自由業'
	    }, {
	    	value: '無職',
	    	text: '無職'
	    }, {
	    	text: 'その他',
	    	type: 'text'
	    }],
	    nextBtn: document.getElementById('toQ2')
	  });
	  
	  this.q[2] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q2'),
	  	question: '<span class="red">QUESTION 2</span><br>同居の家族について教えてください。',
	  	answers: [{
	    	value: '同居の家族は居ない。（一人暮らし）',
	    	text: '同居の家族は居ない。（一人暮らし）',
	    }, {
	    	value: '配偶者',
	    	text: '配偶者'
	    }, {
	    	value: '子供（小学生以下）',
	    	text: '子供（小学生以下）'
	    }, {
	    	value: '子供（中学生または高校生）',
	    	text: '子供（中学生または高校生）'
	    }, {
	    	value: '子供（大学生以上）',
	    	text: '子供（大学生以上）'
	    }, {
	    	value: '両親',
	    	text: '両親'
	    }, {
	    	value: '兄弟姉妹',
	    	text: '兄弟姉妹'
	    }, {
	    	value: '祖父母',
	    	text: '祖父母'
	    }, {
	    	text: 'その他',
	    	type: 'text'
	    }],
	    nextBtn: document.getElementById('toQ3')
	  });

	  this.q[3] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q3'),
	  	question: '<span class="red">QUESTION 3</span><br>秋冬の風邪・インフルエンザ対策について<br>意識的に行っていることを教えてください。',
	  	answers: [{
	    	value: 'うがいをする',
	    	text: 'うがいをする',
	    }, {
	    	value: '手洗いをする',
	    	text: '手洗いをする'
	    }, {
	    	value: 'マスクの着用',
	    	text: 'マスクの着用'
	    }, {
	    	value: '加湿器を使う',
	    	text: '加湿器を使う'
	    }, {
	    	value: 'インフルエンザ予防接種を受ける',
	    	text: 'インフルエンザ予防接種を受ける'
	    }, {
	    	value: '乳酸菌飲料を飲む',
	    	text: '乳酸菌飲料を飲む'
	    }, {
	    	text: 'その他',
	    	type: 'text'
	    }],
	    nextBtn: document.getElementById('toQ4')
	  });
	  
	  this.q[4] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q4'),
	  	question: '<span class="red">QUESTION 4</span><br>コンビニに行く頻度を教えてください。',
	  	answers: [{
	    	value: '毎日',
	    	text: '毎日',
	    }, {
	    	value: '週4〜5回',
	    	text: '週4〜5回'
	    }, {
	    	value: '週2〜3回',
	    	text: '週2〜3回'
	    }, {
	    	value: '週1回',
	    	text: '週1回'
	    }, {
	    	value: '月2〜3回',
	    	text: '月2〜3回'
	    }, {
	    	value: '月1回',
	    	text: '月1回'
	    }, {
	    	value: '月1回未満',
	    	text: '月1回未満'
	    }, {
	    	value: '殆ど行かない',
	    	text: '殆ど行かない'
	    }],
	    nextBtn: document.getElementById('toQ5')
	  });

	  this.q[5] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q5'),
	  	question: '<span class="red">QUESTION 5</span><br>ペットボトル飲料を飲む頻度を教えてください。',
	  	answers: [{
	    	value: '毎日',
	    	text: '毎日',
	    }, {
	    	value: '週4〜5回',
	    	text: '週4〜5回'
	    }, {
	    	value: '週2〜3回',
	    	text: '週2〜3回'
	    }, {
	    	value: '週1回',
	    	text: '週1回'
	    }, {
	    	value: '月2〜3回',
	    	text: '月2〜3回'
	    }, {
	    	value: '月1回',
	    	text: '月1回'
	    }, {
	    	value: '月1回未満',
	    	text: '月1回未満'
	    }, {
	    	value: '殆ど行かない',
	    	text: '殆ど行かない'
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
	    	if (localStorage.getItem('bmUser')) { // this browser already have user
					user.isWanderer = false;
					user.source = this.params.source;
					user.loadLocal();
					this.enableSaveAnswer();
					this.continue();
				}
				else {
			    // this.pages.toPage('regPage');
			    // this.pages.toPage('page1');
			    this.pages.toPage('termsPage1');
			  }
		  }, t);
	  }
	  else {
			if (localStorage.getItem('bmUser')) { // for single user per browser
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
	  if (this.params.userId) {
	  	user.clearLocal();
	  }

	  var localUser = localStorage.getItem('bmUser');
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
        videoId: 'mWzzKVZ15LE',
        events: {
          'onStateChange': (event) => {
            if (event.data == YT.PlayerState.ENDED) {
            	console.log(winningLogic.processed);
            	if (!winningLogic.processed) {
					this.initResult('lose');
				}
				else {
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
});

export {
	user
}