var jpeg = require("jpeg-js");
var fs = require("fs");
var dct = require("dct");

function calculate_hash(filename){
	//read image
	var jpegData = fs.readFileSync(filename);
	//decode jpg image
	var rawImageData = jpeg.decode(jpegData);
	//get pixels
	var frameData = rawImageData.data;

	var i = 0;
	var red, green, blue, alpha, greyscale;
	while (i < frameData.length) {
	  red = frameData[i++];
	  green = frameData[i++];
	  blue = frameData[i++];
	  alpha = frameData[i++];
	  greyscale = (red+green+blue)/3;
	  frameData[i-4] = greyscale;
	  frameData[i-3] = greyscale;
	  frameData[i-2] = greyscale;
	}

	var jpegImageData = jpeg.encode(rawImageData, 100);
	fs.writeFileSync("test.jpg", jpegImageData.data);

	//convert to a 8*8 grayscale thumbnail;
	var width = 32, height = 32;
	var w_ratio = Math.floor(rawImageData.width / width);
	var h_ratio = Math.floor(rawImageData.height / height);
	var total_extract = w_ratio*h_ratio;
	var newData = new Buffer(width * height * 4);
	for (var i=0;i<height;i++) {
		for (var j=0;j<width;j++) {
			var px = Math.floor(j*w_ratio) ;
			var py = Math.floor(i*h_ratio) ;
			newData[((i*width)+j)*4] = frameData[Math.floor((py*rawImageData.width)+px)*4];
			newData[((i*width)+j)*4+1] = frameData[Math.floor((py*rawImageData.width)+px)*4+1];
			newData[((i*width)+j)*4+2] = frameData[Math.floor((py*rawImageData.width)+px)*4+2];
			newData[((i*width)+j)*4+3] = frameData[Math.floor((py*rawImageData.width)+px)*4+3];
		}
	}

	var rawNewImageData = {
	  data: newData,
	  width: width,
	  height: height
	};
	var newJpegImageData = jpeg.encode(rawNewImageData, 100);
	fs.writeFileSync("test2.jpg", newJpegImageData.data);

	i=0;
	var color_array = [];
	while(i<newData.length){
		color_array.push(newData[i]);
		i+=4;
	}

	var dct_array = dct(color_array);

	for(i=0;i<dct_array.length;i++){
		dct_array[i] = Math.floor(dct_array[i]);
	}

	var reducded_dct_array = [];
	for(i = 0; i < 8; i++){
		for(j = 0; j<8; j++){
			reducded_dct_array[i*8+j] = dct_array[i*64+j];
		}
	}

	//compute average dct value
	i = 0;
	var total = 0;
	while(i<reducded_dct_array.length){
		total += reducded_dct_array[i];
		i++;
	}
	var avg = Math.floor(total/reducded_dct_array.length);

	//compute hash
	i = 0;
	var dec_sum_format = 0;
	while(i<reducded_dct_array.length){
		if(reducded_dct_array[i]>avg){
			dec_sum_format=dec_sum_format*2+1;
		}else{
			dec_sum_format=dec_sum_format*2;
		}
		i++;
	}
	var final_hash = dec_sum_format.toString(16);
	var pad = "0000000000000000";
	var ans = pad.substring(0, pad.length - final_hash.length) + final_hash;
	return ans
}

function comparison(filename1, filename2){
	var hash_a = calculate_hash(filename1);
	var hash_b = calculate_hash(filename2);
	var hash_array = [hash_a, hash_b];
	var same = 0;
	var array_a = hash_a.split("");
	var array_b = hash_b.split("");
	for(var i = 0; i < array_a.length; i++){
		if(array_a[i] === array_b[i]){
			same++;
		}
	}
	if(same <= 4){
		console.log('Unlikely similar');
	}else{
		console.log('Similar');
	}
}

comparison(process.argv[2], process.argv[3]);