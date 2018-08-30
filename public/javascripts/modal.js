var modal = {
	init: function() {
    var modalOpener = document.getElementsByClassName('modalOpener');
    var modalCloser = document.getElementsByClassName('modalCloser');
    for (var o = 0; o < modalOpener.length; o++) {
      modalOpener[o].addEventListener('click', function() {
        var target = this.dataset.target;
        document.getElementById(target).style.display = 'block';
      });
    }

    for (var c = 0; c < modalCloser.length; c++) {
    	modalCloser[c].addEventListener('click', function() {
    		var target = this.dataset.target;
    		document.getElementById(target).style.display = 'none';
    	})
    }
	},
  closeAll: function() {
    var allModals = document.getElementsByClassName('modal');
    for (var m = 0; m < allModals.length; m++) {
      allModals[m].style.display = 'none';
    }
  }
}
// window.modal = modal;
export default modal;