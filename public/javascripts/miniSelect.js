var miniSelect = {
	classes: "",
	init: function(suppClasses) {
		var _this = this;
		this.classes = suppClasses;
		var classes = suppClasses.split(" ");

		for (var c = 0; c < classes.length; c++) {
			var wrapper = document.getElementsByClassName(classes[c]);
			var selEle, head, itemWrapper, item;
			for (var w = 0; w < wrapper.length; w++) {
				selEle = wrapper[w].getElementsByTagName('select')[0];
				head = document.createElement('div');
				head.dataset.showing = 0;
				head.setAttribute("class", classes[c] + '-selected');
				head.innerHTML = selEle.options[selEle.selectedIndex].innerHTML;
				wrapper[w].appendChild(head);
        itemWrapper = document.createElement('div');
        itemWrapper.setAttribute("class", classes[c] + '-items');
        for (var i = 1; i < selEle.length; i++) {
	        	item = document.createElement('div');
	        	item.innerHTML = selEle.options[i].innerHTML;
	        	item.dataset.index = i;
	        	item.addEventListener('click', function(e) {
	            var s = this.parentNode.parentNode.getElementsByTagName("select")[0]; 
	            var h = this.parentNode.previousSibling;
	            s.selectedIndex = this.dataset.index;
	            h.innerHTML = this.innerHTML;
	            h.click();
	            selEle.onchange();
        	});
        	itemWrapper.appendChild(item);
        }
        itemWrapper.style.display = 'none';
	      wrapper[w].appendChild(itemWrapper);
	      head.addEventListener('click', function(e) {
	      	e.stopPropagation();
	      	if (this.dataset.showing == 0) {
		      	if (this.classList.contains('active')) {
		      		this.classList.remove('active');
		      		_this.close(this, this.nextSibling);
		      	}
		      	else {
		      		this.classList.add('active');
		      		_this.show(this, this.nextSibling);
		      	}
	      	}
	      });
			}
		}
		document.addEventListener("click", function() {_this.closeAllSelect()});
	},
	closeAllSelect: function() {
    var classes = this.classes.split(" ");
    for (var c = 0; c < classes.length; c++) {
      var itemWrappers = document.getElementsByClassName(classes[c] + '-items');
      var heads = document.getElementsByClassName(classes[c] + '-selected');
      for (var h = 0; h < heads.length; h++) {
      	if (heads[h].dataset.showing == 0) {
      		if (heads[h].classList.contains('active')) {
	      		heads[h].classList.remove('active');
	      		this.close(heads[h], heads[h].nextSibling);
	      	}
      	}
      }
    }
	},
	show: function(head, ele) {
		head.dataset.showing = 1;
		ele.style.transition = 'none';
		ele.style.display = 'block';
		ele.style.opacity = '0';
		ele.style.transform = 'translateY(-50px)';
		setTimeout(function() {
      ele.style.transition = 'all 0.3s';
      ele.style.opacity = '1';
      ele.style.transform = 'translateY(0)';
      setTimeout(function() {
        head.dataset.showing = 0;
      }, 350);
		}, 100);
	},
	close: function(head, ele) {
		head.dataset.showing = 1;
    ele.style.transition = 'all 0.3s';
    ele.style.opacity = '0';
    ele.style.transform = 'translateY(-50px)';
    setTimeout(function() {
      ele.style.display = 'none';
      head.dataset.showing = 0;
    }, 350);
	},
}

export default miniSelect;