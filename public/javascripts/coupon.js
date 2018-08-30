import axios from 'axios';

var domain = 'https://www.mobileads.com';
var couponCollection = 'testCoupons';
// var domain = 'http://localhost:8080';

var coupon = {
	count: {
		A: 0,
		B: 0,
		C: 0,
		D: 0
	},
  getOne: function(group) {
    return new Promise(function(resolve, reject) {
      if (group) {
        var couponQuery = JSON.stringify({
          group: group,
          redeemed: false
        });
      }
      else {
        var couponQuery = JSON.stringify({
          redeemed: false
        });
      }

      axios.get('https://api.mobileads.com/mgd/qOne?col=' + couponCollection + '&qobj=' + encodeURIComponent(couponQuery)).then((response) => {
        console.log(response);
        if (typeof response.data == 'string') {
          resolve({
            msg: 'no more coupon.',
            status: false
          });
        }
        else {
          resolve({
            msg: 'coupon found.',
            couponId: response.data._id,
            group: response.data.group,
            link: response.data.link,
            status: true
          });
        }
        
      }).catch((error) => {
        console.error(error);
        reject({
            msg: 'error',
            status: false
          });
      });
    });
  },
  redeem: function(couponId, userId) {
    return new Promise(function(resolve, reject) {
      var uQuery = JSON.stringify({
        _id: couponId
      });
      var updateCoupon = JSON.stringify({
        redeemed: true,
        owner: userId
      });
      
      axios.post('https://api.mobileads.com/mgd/updOne?col=' + couponCollection + '&qobj=' + encodeURIComponent(uQuery) + '&uobj=' + encodeURIComponent(updateCoupon))
      .then((resp) => {
        console.log(resp);
        if (resp.data.status == 'success') {
          resolve({
            msg: 'success',
            status: true
          })
        }
        else {
          reject({
            msg: 'error',
            status: false
          });
        }
      }).catch((error) => {
        console.error(error);
        reject({
          msg: 'error',
          status: false
        });
      });
    });
  },
  getGroup: function(groups) {
    return new Promise(function(resolve, reject) {
      var couponGroup = {};
      var retrieved = 0;
      for (var g = 0; g < groups.length; g++) {
        coupon.getOne(groups[g]).then((resp) => {
          
          if (resp.couponId) {
            couponGroup[resp.group] = {
              group: resp.group,
              couponId: resp.couponId,
              couponLink: resp.link
            }
          }
          retrieved++

          if (retrieved == groups.length) {
            resolve(couponGroup);
          }
        }).catch((error) => {
          console.error(error);
          retrieved++;
          reject('error');
        })
      }
    });
  },
	get: function(source) {
		/*var _this = this;
    axios.get(domain + '/api/coupon/softbank/coupons_check', {
    	params: {
    		source: source
    	}
    }).then(function(response) {
      console.log(response);
      _this.count.A = response.data.A;
      _this.count.B = response.data.B;
      _this.count.C = response.data.C;
      _this.count.D = response.data.D;
    }).catch(function(error) {
      console.log(error);
    });*/
	}
}

export default coupon;