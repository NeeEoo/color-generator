function getRGB() {
  var r = Math.floor(Math.random() * 255);
  var g = Math.floor(Math.random() * 255);
  var b = Math.floor(Math.random() * 255);
  return [r, g, b];
}

function getHex(rgb) {
  var hex = "";
  rgb.forEach(function(val) {
    var hexPartial = Number(val).toString(16);
    if (hexPartial.length < 2) {
      hexPartial = "0" + hexPartial;
    }
    hex = hex + hexPartial;
  });
  return hex;
}

function getCMYK(rgb) {
  var finalK = 0;

  var r = rgb[0];
  var g = rgb[1];
  var b = rgb[2];

  if (r === 0 && g === 0 && b === 0) {
    finalK = 1;
    return [0, 0, 0, 1];
  }

  var finalC = 1 - (r / 255);
  var finalM = 1 - (g / 255);
  var finalY = 1 - (b / 255);

  var minCMY = Math.min(finalC, Math.min(finalM, finalY));
  finalC = Math.trunc(((finalC - minCMY) / (1 - minCMY)) * 100);
  finalM = Math.trunc(((finalM - minCMY) / (1 - minCMY)) * 100);
  finalY = Math.trunc(((finalY - minCMY) / (1 - minCMY)) * 100);
  finalK = Math.trunc(minCMY * 100);

  return (finalC + "," + finalM + "," + finalY + "," + finalK);
}

function getContrast(rgb) {
  return ((299 * rgb[0]) + (587 * rgb[1]) + (114 * rgb[2])) / 1000;
}

function generate(elements) {
  elements.each(function(index, column) {
    let rgb = getRGB();
    $(column).find(".color-rgb").text(`(${rgb})`);
    $(column).find(".color-hex").text("#" + getHex(rgb));
    $(column).find(".color-cmyk").text(`(${getCMYK(rgb)})`);
    $(column).css("background-color", `rgb(${rgb})`);
    if (getContrast(rgb) < 123) {
      $(column).addClass("text-white");
    } else {
      $(column).removeClass("text-white");
    }
  });
}

function regenerate() {
  generate($(".color-column[data-locked='false']"));
}

function copy(type, text) {
  var $tempTextField = $("<input>");
  $("body").append($tempTextField);
  switch (type) {
    case "rgb":
      $tempTextField.val("rgb" + text).select();
      break;
    case "hex":
      $tempTextField.val(text).select();
      break;
    case "cmyk":
      $tempTextField.val("cmyk" + text).select();
      break;
  }
  document.execCommand("copy");
  $tempTextField.remove();
}

function showToast(type, text) {
  var alert = "<div class='toast-alert alert alert-" + type + "' role='alert'>" + text + "</div>";
  $(".container-fluid").append(alert);
  $(".toast-alert").animate({
    opacity: 0
  }, 2000, function() {
    $(this).remove();
  });
}

function init() {
  regenerate();

  $(".color-value").click(function(e) {
    var text = $(e.target).text();
    copy($(e.target).data("format"), text);
    showToast("success", "Color code copied to clipboard.");
  });

  $(".color-column-lock").click(function(e) {
    var icon = $(e.target);
    var column = $(e.target).parent().parent();
    var status = column.attr("data-locked");
    if (status === "true") {
      column.attr("data-locked", "false");
    } else {
      column.attr("data-locked", "true");
    }
    icon.toggleClass(["fa-lock-open", "fa-lock"]);
  });

  $(".color-column-regenerate").click(function(e) {
    generate($(e.target).parent().parent());
  });

  $("#submitNewColor").click(function(e) {
    setNewColor(getNewColor(e));
  });

  loadAllPalettes();
}

function setNewColor(values) {
  var column = $(".color-column:eq(" + (parseInt(values[1]) - 1) + ")");
  var rgb = JSON.parse("[" + values[0] + "]");
  $(column).find(".color-rgb").text(`(${rgb})`);
  $(column).find(".color-hex").text("#" + getHex(rgb));
  $(column).find(".color-cmyk").text(`(${getCMYK(rgb)})`);
  $(column).css("background-color", `rgb(${rgb})`);
  if (getContrast(rgb) < 123) {
    $(column).addClass("text-white");
  } else {
    $(column).removeClass("text-white");
  }
}

function getNewColor(e) {
  var string = $(e.target).closest(".modal-content").find("input").val();
  var newString = string.replace("(", "").replace(")", "").replace("rgb", "");
  var column = $(e.target).closest(".modal-content").find("select option:selected").text();
  return [newString, column];
}

function switchTheme() {
  $("body").toggleClass("bg-secondary");
  $(".fa-moon").toggleClass("d-none");
  $(".fa-sun").toggleClass("d-none");
  $(".color-column-labels").toggleClass("text-white");
}

function savePalette() {
  var paletteName = $("#inputPaletteName").val();
  if (paletteName === null || paletteName == "undefined" || paletteName == "") {
    alert("Error: You must enter a valid name for this palette.");
  } else {
    if (typeof(Storage) !== "undefined") {
      // Query object of all rgb colors and store text values in new object
      var rgbDOMObject = $(".color-rgb");
      var rgbStorageObject = {
        "0": $(rgbDOMObject[0]).text().replace("(", "").replace(")", ""),
        "1": $(rgbDOMObject[1]).text().replace("(", "").replace(")", ""),
        "2": $(rgbDOMObject[2]).text().replace("(", "").replace(")", ""),
        "3": $(rgbDOMObject[3]).text().replace("(", "").replace(")", ""),
        "4": $(rgbDOMObject[4]).text().replace("(", "").replace(")", "")
      };
      // Generate random key, ensure it doesn't exist already, then save the key in storage
      var randomKey = generateRandomKey();
      var keysObject = localStorage.getItem("paletteKeys");
      if (keysObject === null) {
        var newKeysObject = {};
        newKeysObject[paletteName] = randomKey;
      } else {
        var newKeysObject = JSON.parse(keysObject);
        newKeysObject[paletteName] = randomKey;
      }
      localStorage.setItem("paletteKeys", JSON.stringify(newKeysObject));

      // Save color palette object
      localStorage.setItem(randomKey, JSON.stringify(rgbStorageObject));
      $("#savedPalettesModal").find(".modal-body").append("<button class='btn btn-outline-secondary my-2 w-100' onclick='loadPalette(" + randomKey + ")'>" + paletteName + "</button>");
      showToast("success", "Color palette saved.");

    } else {
      alert("Sorry, your browser does not support Web Storage. Please ugrade your browser and try again.");
    }
  }
}

function loadAllPalettes() {
  if (typeof(Storage) !== "undefined") {
    var fetchedData = localStorage.getItem("paletteKeys");
    if (fetchedData === null) {
      console.log("Error: No palettes exist.");
    } else {
      $.each(JSON.parse(fetchedData), function(key, value) {
        var palette = localStorage.getItem(key);
        $("#savedPalettesModal").find(".modal-body").append("<button class='btn btn-outline-secondary my-2 w-100' onclick='loadPalette(" + value + ")'>" + key + "</button>");
        // setNewColor([value, newKey]);
        $("#editColorModal").modal("hide");
      });
      showToast("success", "Color palettes loaded.");
    }
  } else {
    alert("Sorry, your browser does not support Web Storage. Please ugrade your browser and try again.");
  }
}

function loadPalette(requestedKey) {
  var fetchedData = localStorage.getItem("paletteKeys");
  $.each(JSON.parse(fetchedData), function(key, value) {
    var newValue = parseInt(value, 10);
    if (requestedKey === newValue) {
      var palette = localStorage.getItem(value);
      $.each(JSON.parse(palette), function(subKey, subValue) {
        var col = parseInt(subKey, 10) + 1;
        setNewColor([subValue, col]);
      });
    }
    $("#editColorModal").modal("hide");
  });
}

function generateRandomKey() {
  // Generate random key
  var randomKey = Math.floor((Math.random() * 9007199254740992) + 1);
  // Check if random key exists (up to 100 times)
  for (var i = 0; i < 100; i++) {
    // If the key exists, generate a new key
    if (checkKey(randomKey) === true) {
      randomKey = Math.floor((Math.random() * 9007199254740992) + 1);
    }
    // If the key does not exist, break the loop and return the key
    else {
      break;
    }
  }
  return randomKey;
}

function checkKey(key) {
  // Fetch paletteKeys object
  var keysObject = localStorage.getItem("paletteKeys");
  // If object is null, it doesn't exist yet
  if (keysObject !== null) {
    // If object exists, parse it and check to see if the key exists
    var tempObject = JSON.parse(keysObject);
    if (tempObject.hasOwnProperty(key.toString())) {
      return true;
    } else {
      return false;
    }
  }
}

function saveImage() {
  $("#saveImageModal img").remove();
  $(".color-column-toolbar").hide();

  var bgColor = $("body").hasClass("bg-secondary") ? "#000000" : "#FFFFFF";

  html2canvas(document.getElementsByClassName("container-fluid")[0], {backgroundColor:bgColor}).then(function(canvas) {
    $(".color-column-toolbar").show();
    var img = canvas.toDataURL("image/png");
    $("#saveImageModal").modal("show");
    $("#saveImageModal .modal-body").append('<img id="palette-image" class="img-fluid" src="'+img+'"/>');
  });
}