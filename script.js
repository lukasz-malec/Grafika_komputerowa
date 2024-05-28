
// Jako argumenty funkcji należy podać lokalizację sześcianu w świecie i zmienną pozwalającą zmienić jego rozmiar.

function generate_box(position, size) {
    const [x, y, z] = position;
    const s = size; 

    const vertices = [
        // Top
        x - s, y + s, z - s,
        x - s, y + s, z + s,
        x + s, y + s, z + s,
        x + s, y + s, z - s,

        // Left
        x - s, y + s, z + s,
        x - s, y - s, z + s,
        x - s, y - s, z - s,
        x - s, y + s, z - s,

        // Right
        x + s, y + s, z + s,
        x + s, y - s, z + s,
        x + s, y - s, z - s,
        x + s, y + s, z - s,

        // Front
        x + s, y + s, z + s,
        x + s, y - s, z + s,
        x - s, y - s, z + s,
        x - s, y + s, z + s,

        // Back
        x + s, y + s, z - s,
        x + s, y - s, z - s,
        x - s, y - s, z - s,
        x - s, y + s, z - s,

        // Bottom
        x - s, y - s, z - s,
        x - s, y - s, z + s,
        x + s, y - s, z + s,
        x + s, y - s, z - s,
    ];

    const indices = [
        // Top
        0, 1, 2,
        0, 2, 3,

        // Left
        5, 4, 6,
        6, 4, 7,

        // Right
        8, 9, 10,
        8, 10, 11,

        // Front
        13, 12, 14,
        15, 14, 12,

        // Back
        16, 17, 18,
        16, 18, 19,

        // Bottom
        21, 20, 22,
        22, 20, 23,
    ];

    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices)
    };
}



const vertexShaderTxt = `
    precision mediump float;

    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProjection;
    
    attribute vec3 vertPosition;
    attribute vec3 vertColor;

    varying vec3 fragColor;

    void main() {
        fragColor = vertColor;
        gl_Position = mProjection * mView * mWorld * vec4(vertPosition, 1.0);
    }
`;

const fragmentShaderTxt = `
    precision mediump float;

    varying vec3 fragColor;

    void main() {
        gl_FragColor = vec4(fragColor, 1.0);
    }
`;

const mat4 = glMatrix.mat4;

const Triangle = function () {
    const canvas = document.getElementById('main-canvas');
    const gl = canvas.getContext('webgl');
    let canvasColor = [0.2, 0.5, 0.8];

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
    checkShaderCompile(gl, fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    checkLink(gl, program);

    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);

    const position1 = [-1, -1, -1]; // lokalizacja pierwszego szescianu 
    const position2 = [1, 1, 1]; // lokalizacja drugiego sześcianu
    const size = 0.5; // rozmiar



    const { vertices: vertices1, indices: indices1 } = generate_box(position1, size);
    const { vertices: vertices2, indices: indices2 } = generate_box(position2, size);

    const vertices = new Float32Array([...vertices1, ...vertices2]);
    const indices = new Uint16Array([...indices1, ...indices2.map(index => index + vertices1.length / 3)]);

    const boxVertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const boxIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const posAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    gl.vertexAttribPointer(
        posAttribLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        3 * Float32Array.BYTES_PER_ELEMENT,
        0
    );
    gl.enableVertexAttribArray(posAttribLocation);

    const colors = [
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.2, 1.0,
        0.5, 1.0, 0.0,

        0.8, 0.0, 0.2,
        0.0, 1.0, 1.0,
        0.0, 0.2, 1.0,
        0.5, 1.0, 0.0,

        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.2, 1.0,
        0.5, 1.0, 0.0,

        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.2, 1.0,
        0.5, 1.0, 0.0,

        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.2, 1.0,
        0.5, 1.0, 0.0,

        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.2, 1.0,
        0.5, 1.0, 0.0,
    ];

    const colorsArray = new Float32Array([...colors, ...colors]);

    const triangleColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorsArray, gl.STATIC_DRAW);

    const colorAttribLocation = gl.getAttribLocation(program, 'vertColor');
    gl.vertexAttribPointer(
        colorAttribLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        3 * Float32Array.BYTES_PER_ELEMENT,
        0,
    );
    gl.enableVertexAttribArray(colorAttribLocation);

    // render time

    gl.useProgram(program);

    const worldMatLoc = gl.getUniformLocation(program, 'mWorld');
    const viewMatLoc = gl.getUniformLocation(program, 'mView');
    const projectionMatLoc = gl.getUniformLocation(program, 'mProjection');

    const worldMatrix = mat4.create();
    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, [0, 0, -4], [0, 0, 0], [0, 1, 0]);
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, glMatrix.glMatrix.toRadian(60),
        canvas.width / canvas.height, 1, 10);

    gl.uniformMatrix4fv(worldMatLoc, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(viewMatLoc, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(projectionMatLoc, gl.FALSE, projectionMatrix);

    const identityMat = mat4.create();
    let angle = 0;

    const loop = function () {
        angle = performance.now() / 1000 / 6 * 2 * Math.PI;
        mat4.rotate(worldMatrix, identityMat, angle, [1, 1, -0.5]);
        gl.uniformMatrix4fv(worldMatLoc, gl.FALSE, worldMatrix);

        gl.clearColor(...canvasColor, 1.0);   // R, G, B,  A 
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
}

function checkGl(gl) {
    if (!gl) { console.log('WebGL not supported, use another browser'); }
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

window.onload = Triangle;

