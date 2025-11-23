function translation(dx, dy, dz, gl, program){
    var forMatrix = new Float32Array([
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        dx, dy, dz, 1.0
    ]);

    var uFormMatrix = gl.getUniformLocation(program, 'uFormMatrix');
    gl.uniformMatrix4fv(uFormMatrix, false, forMatrix);
}

function scale(sx, sy, sz, gl, program){
    var forMatrix = new Float32Array([
        sx, 0.0, 0.0, 0.0,
        0.0, sy, 0.0, 0.0,
        0.0, 0.0, sz, 0.0,
        0.0, 0.0, 0.0, 1.0
    ]);

    var uFormMatrix = gl.getUniformLocation(program, 'uFormMatrix');
    gl.uniformMatrix4fv(uFormMatrix, false, forMatrix);
}

function shear(angle, gl, program){
    var cota = 1/Math.tan(angle);
    var forMatrix = new Float32Array([
        1.0, cota, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ]);

    var uFormMatrix = gl.getUniformLocation(program, 'uFormMatrix');
    gl.uniformMatrix4fv(uFormMatrix, false, forMatrix);
}

function rotateZ(angle, gl, program){
    var sa = Math.sin(angle);
    var ca = Math.cos(angle);
    var forMatrix = new Float32Array([
        ca, -sa, 0.0, 0.0,
        sa, ca, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ]);

    var uFormMatrix = gl.getUniformLocation(program, 'uFormMatrix');
    gl.uniformMatrix4fv(uFormMatrix, false, forMatrix);
}

function rotateX(angle, gl, program){
    var sa = Math.sin(angle);
    var ca = Math.cos(angle);
    var forMatrix = new Float32Array([
        1.0, 0.0, 0.0, 0.0,
        0.0, ca, -sa, 0.0,
        0.0, sa, ca, 0.0,
        0.0, 0.0, 0.0, 1.0
    ]);

    var uFormMatrix = gl.getUniformLocation(program, 'uFormMatrix');
    gl.uniformMatrix4fv(uFormMatrix, false, forMatrix);
}

function rotateY(angle, gl, program){
    var sa = Math.sin(angle);
    var ca = Math.cos(angle);
    var forMatrix = new Float32Array([
        ca, 0.0, sa, 0.0,
        0.0, 1.0, 0.0, 0.0,
        -sa, 0.0, ca, 0.0,
        0.0, 0.0, 0.0, 1.0
    ]);

    var uFormMatrix = gl.getUniformLocation(program, 'uFormMatrix');
    gl.uniformMatrix4fv(uFormMatrix, false, forMatrix);
}