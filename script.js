const vertexShaderTxt = `
    precision mediump float;

    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProjection;
    
    attribute vec3 vertPosition;
    attribute vec2 textureCoord;
    attribute vec3 vertNormal;

    varying vec2 fragTextureCoord;
    varying vec3 fragNormal;

    void main() {
        fragTextureCoord = textureCoord;
        fragNormal = (mWorld * vec4(vertNormal, 0.0)).xyz;

        gl_Position = mProjection * mView * mWorld * vec4(vertPosition, 1.0);
    }
`
const fragmentShaderTxt = `
    precision mediump float;

    varying vec2 fragTextureCoord;
    varying vec3 fragNormal;

    uniform vec3 ambient;
    uniform vec3 lightDirection;
    uniform vec3 lightColor;

    uniform sampler2D sampler;

    void main() {
        vec3 normfragNormal = normalize(fragNormal);
        vec3 normlightDirection = normalize(lightDirection);


        vec3 light = ambient  + 
            lightColor * max(dot(normfragNormal,normlightDirection),0.0);

        vec4 tex = texture2D(sampler, fragTextureCoord);

        gl_FragColor = vec4(tex.rgb * light, tex.a);
    }
`
const mat4 = glMatrix.mat4;

function startDraw() {
    OBJ.downloadMeshes({
        'maze': 'a-maze.obj'
    }, Triangle);
}

const Triangle = function (meshes) {
    const canvas = document.getElementById('main-canvas');
    const gl = canvas.getContext('webgl');
    let canvasColor = [0.2, 0.5, 0.8]

    checkGl(gl);

    gl.clearColor(...canvasColor, 1.0);   // R, G, B,  A 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);



    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderTxt);
    gl.shaderSource(fragmentShader, fragmentShaderTxt);

    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    checkShaderCompile(gl, vertexShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);

    gl.validateProgram(program);

    OBJ.initMeshBuffers(gl, meshes.maze);

    // const boxVertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, meshes.maze.vertexBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

    // const boxIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshes.maze.indexBuffer);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);
    
    const posAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    gl.vertexAttribPointer(
        posAttribLocation,
        meshes.maze.vertexBuffer.itemSize,
        gl.FLOAT,
        gl.FALSE,
        0,
        0
    );
    gl.enableVertexAttribArray(posAttribLocation);



    const textureLocation = gl.getAttribLocation(program, 'textureCoord');
    gl.vertexAttribPointer(
        textureLocation,
        meshes.maze.textureBuffer.itemSize,
        gl.FLOAT,
        gl.FALSE,
        0,
        0,
    );
    gl.enableVertexAttribArray(textureLocation);


    // const boxTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, meshes.maze.normalBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxTextureCoords), gl.STATIC_DRAW);
    
    const normLocation = gl.getAttribLocation(program, 'vertNormal');
    gl.vertexAttribPointer(
        normLocation,
        meshes.maze.textureBuffer.itemSize,
        gl.FLOAT,
        gl.TRUE,
        0,
        0,
    );
    gl.enableVertexAttribArray(normLocation);



    const img = document.getElementById('img');
    const boxTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, boxTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        img
    )

    // render time

    gl.useProgram(program);

    const worldMatLoc = gl.getUniformLocation(program, 'mWorld');
    const viewMatLoc = gl.getUniformLocation(program, 'mView');
    const projectionMatLoc = gl.getUniformLocation(program, 'mProjection');

    const worldMatrix = mat4.create();
    const worldMatrix2 = mat4.create();

    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, [0,0,-12], [0,0,0], [0,1,0]);
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, glMatrix.glMatrix.toRadian(60), 
                    canvas.width/canvas.height, 1, 100)

    gl.uniformMatrix4fv(worldMatLoc, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(viewMatLoc, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(projectionMatLoc, gl.FALSE, projectionMatrix);

    let ambientLocation = gl.getUniformLocation(program, 'ambient');
    let lightDirLoc = gl.getUniformLocation(program, 'lightDirection');
    let lightColorLoc = gl.getUniformLocation(program, 'lightColor');



    let ambienColor = [0.5, 0.5, 0.2]
    gl.uniform3f(ambientLocation, ...ambienColor);
    gl.uniform3f(lightDirLoc, 2.0, 3.0, -1.0);
    gl.uniform3f(lightColorLoc, 0.4, 0.4, 0.2);
    


    const identityMat = mat4.create();
    let rotationMatrix = new Float32Array(16);
    let translationMatrix = new Float32Array(16);
    let angle = 0;

    const loop = function () {
        angle = performance.now() / 1000 / 60 * 23 * Math.PI;
        mat4.rotate(worldMatrix, identityMat, angle, [1,1,-0.5]);
        gl.uniformMatrix4fv(worldMatLoc, gl.FALSE, worldMatrix);
        
        gl.clearColor(...canvasColor, 1.0);   // R, G, B,  A 
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindTexture(gl.TEXTURE_2D, boxTexture);
		gl.activeTexture(gl.TEXTURE0); 
        // gl.drawArrays(gl.TRIANGLES, 0, 24);
        gl.drawElements(gl.TRIANGLES, meshes.maze.indexBuffer.numItems, 
                gl.UNSIGNED_SHORT, 0); 

        // rotationMatrix = new Float32Array(16);
        // translationMatrix = new Float32Array(16);

        // mat4.fromRotation(rotationMatrix, angle/2, [1,2,0]);
        // mat4.fromTranslation(translationMatrix, [2,0,0]);
        // mat4.mul(worldMatrix2, translationMatrix, rotationMatrix);
        // gl.uniformMatrix4fv(worldMatLoc, gl.FALSE, worldMatrix2);
        // gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

} 


function checkGl(gl) {
    if (!gl) {console.log('WebGL not suppoerted, use another browser');}
}

function checkShaderCompile(gl, shader) {
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('shader not compiled', gl.getShaderInfoLog(shader));
    }
}

function checkLink(gl, program) {
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('linking error', gl.getProgramInfoLog(program));
    }
}
