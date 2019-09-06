import './gl-matrix-2.2.1';

var gl;

var pos = [-1.5, 0.0, -5.4];
var rot = 0;

function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}


function getShader(gl, id) {
    //Get the script element
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    //Get the shader code
    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    //Check if the shader is either a fragment or vertex shader and create it
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    //Set the shader's source to the code from the script
    gl.shaderSource(shader, str);
    //Compile the shader from source
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


var shaderProgram;

//Fragment shader: handles the coloring of the screen
//Vertex shader: handles the positioning of the vertices
function initShaders() {
    //Get shader code from page
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    //Create blank shader program
    shaderProgram = gl.createProgram();
    //Bind the two shaders to the new program (only one of each type) and finally link them
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    //Set this program to be the one in use by WebGL
    gl.useProgram(shaderProgram);

    //Get a pointer to aVertexPosition attribute from the shader and store it in shaderProgram
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    //Attributes are disabled by default, and need to be enabled to be used by our code
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    //This code gets both uniforms from the shader program, and also stores them in the program variable for later use
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}


var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function setMatrixUniforms() {
    //Upload the projection- and model-view matrix to the current shader in use
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


var octagonVertexPositionBuffer;

function initBuffers() {
    //Create the buffer
    octagonVertexPositionBuffer = gl.createBuffer();
    //Set current buffer in use to octagonVertexPositionBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, octagonVertexPositionBuffer);
    //Create the vertices
    var vertices = [
        0.0, 0.0, 0.0,
        1.0, 1.0, 0.0,
        2.25, 1.0, 0.0,
        3.25, 0.0, 0.0,
        3.25, -1.25, 0.0,
        2.25, -2.25, 0.0,
        1.0, -2.25, 0.0,
        0.0, -1.25, 0.0
    ];
    //Put the vertex data into the current buffer in use (octagonVertexPositionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    //Log the number of items (vertices) and the number of floats that make up a vertex (3)
    octagonVertexPositionBuffer.itemSize = 3;
    octagonVertexPositionBuffer.numItems = 8;
}


function drawScene() {
    rot += 0.01;
    if(rot > 90)
        rot = 0;

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix, 45.0, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

    mat4.identity(mvMatrix);


    //mat4.translate(mvMatrix, mvMatrix, [10, 0, 0]);

    mat4.rotateZ(mvMatrix, mvMatrix, rot);

    //Do the translation and update the model's position
    mat4.translate(mvMatrix, mvMatrix, [-1.5, 0.5, -5.4]);

    //Current buffer in use will be octagonVertexPositionBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, octagonVertexPositionBuffer);
    //This line sets the shaderProgram's vertexPositionAttribute to the currently bound buffer (the octagonVertexPositionBuffer)
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, octagonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    //This code uploads the projection- and model-view matrix into the shaders
    setMatrixUniforms();
    //This draws the vertices with the setup state
    gl.drawArrays(gl.TRIANGLE_FAN, 0, octagonVertexPositionBuffer.numItems);

}
function webGLStart() {
    var canvas = document.getElementById("lesson01-canvas");
    initGL(canvas);
    initShaders();
    initBuffers();

    //Set the backbround color to black
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //Set WebGL to check if a model is behind another
    gl.enable(gl.DEPTH_TEST);

    //This is the draw function
    //When it's called, it draws the scene
    //and calls itself again after one second.
    //This means we're running on 1 FPS :D
    function draw() {
        drawScene();
        setTimeout(draw, 16.7);
    }

    //Initial setTimeout to jumpstart the draw function above
    setTimeout(draw, 1);
}


window.onload = webGLStart();