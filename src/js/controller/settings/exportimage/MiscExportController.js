(function () {
  var ns = $.namespace('pskl.controller.settings.exportimage');

  var BLACK = '#000000';

  ns.MiscExportController = function (piskelController) {
    this.piskelController = piskelController;
  };

  pskl.utils.inherit(ns.MiscExportController, pskl.controller.settings.AbstractSettingController);

  ns.MiscExportController.prototype.init = function () {
    var cDownloadButton = document.querySelector('.c-download-button');
    this.addEventListener(cDownloadButton, 'click', this.onDownloadCFileClick_);

    this.headerCheckbox = document.querySelector('.c-header-checkbox');
    this.headerCheckbox.checked = this.getHeaderSetting_();
    this.addEventListener(this.headerCheckbox, 'change', this.onHeaderCheckboxChange_);

    this.progmemCheckbox = document.querySelector('.c-progmem-checkbox');
    this.progmemCheckbox.checked = this.getProgmemSetting_();
    this.addEventListener(this.progmemCheckbox, 'change', this.onProgmemCheckboxChange_);
  };

  ns.MiscExportController.prototype.onHeaderCheckboxChange_ = function () {
    var checked = this.headerCheckbox.checked;
    pskl.UserSettings.set(pskl.UserSettings.EXPORT_C_HEADER, checked);
  };

  ns.MiscExportController.prototype.getHeaderSetting_ = function () {
    return pskl.UserSettings.get(pskl.UserSettings.EXPORT_C_HEADER);
  };

  ns.MiscExportController.prototype.onProgmemCheckboxChange_ = function () {
    var checked = this.progmemCheckbox.checked;
    pskl.UserSettings.set(pskl.UserSettings.EXPORT_C_PROGMEM, checked);
  };

  ns.MiscExportController.prototype.getProgmemSetting_ = function () {
    return pskl.UserSettings.get(pskl.UserSettings.EXPORT_C_PROGMEM);
  };

  ns.MiscExportController.prototype.onDownloadCFileClick_ = function (evt) {
    var fileName = this.getPiskelName_();
    if (this.headerCheckbox.checked) {
      fileName += '.h';
    } else {
      fileName += '.c';
    }
    var cName = this.getPiskelName_().replace(' ', '_');
    var width = this.piskelController.getWidth();
    var height = this.piskelController.getHeight();
    var frameCount = this.piskelController.getFrameCount();

    // Useful defines for C routines
    var frameStr = '#include <stdint.h>\n';
    if (this.progmemCheckbox.checked) {
      frameStr += '#include <avr/pgmspace.h>\n';
    }
    frameStr += '\n';
    frameStr += '#define ' + cName.toUpperCase() + '_FPS ' + this.piskelController.getFPS() + '\n';
    frameStr += '#define ' + cName.toUpperCase() + '_FRAME_COUNT ' + this.piskelController.getFrameCount() + '\n';
    frameStr += '#define ' + cName.toUpperCase() + '_FRAME_WIDTH ' + width + '\n';
    frameStr += '#define ' + cName.toUpperCase() + '_FRAME_HEIGHT ' + height + '\n\n';

    frameStr += '/* Piskel data for \"' + this.getPiskelName_() + '\" */\n\n';

    frameStr += 'static const uint32_t ';
    if (this.progmemCheckbox.checked) {
      frameStr += 'PROGMEM ';
    }
    frameStr += cName.toLowerCase();
    frameStr += '_data[' + frameCount + '][' + width * height + '] = {\n';

    for (var i = 0; i < frameCount; i++) {
      var render = this.piskelController.renderFrameAt(i, true);
      var context = render.getContext('2d');
      var imgd = context.getImageData(0, 0, width, height);
      var pix = imgd.data;

      frameStr += '{\n';
      for (var j = 0; j < pix.length; j += 4) {
        frameStr += this.rgbToCHex(pix[j], pix[j + 1], pix[j + 2], pix[j + 3]);
        if (j != pix.length - 4) {
          frameStr += ', ';
        }
        if (((j + 4) % (width * 4)) === 0) {
          frameStr += '\n';
        }
      }
      if (i != (frameCount - 1)) {
        frameStr += '},\n';
      } else {
        frameStr += '}\n';
      }
    }

    frameStr += '};\n';
    pskl.utils.BlobUtils.stringToBlob(frameStr, function (blob) {
      pskl.utils.FileUtils.downloadAsFile(blob, fileName);
    }.bind(this), 'application/text');
  };

  ns.MiscExportController.prototype.getPiskelName_ = function () {
    return this.piskelController.getPiskel().getDescriptor().name;
  };

  ns.MiscExportController.prototype.rgbToCHex = function (r, g, b, a) {
    var hexStr = '0x';
    hexStr += ('00' + a.toString(16)).substr(-2);
    hexStr += ('00' + r.toString(16)).substr(-2);
    hexStr += ('00' + g.toString(16)).substr(-2);
    hexStr += ('00' + b.toString(16)).substr(-2);
    return hexStr;
  };
})();
