// Fungsi Helper Load Texture (Sudah Support 512x512)
function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Placeholder pixel
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([255, 255, 255, 255]); // Putih sementara
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

        // Aktifkan REPEAT dan MIPMAP (Wajib gambar 512x512)
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    };
    image.src = url; 
    return texture;
}

function main(){
    var canvas = document.getElementById("myCanvas");
    var gl = canvas.getContext("webgl");

    // --- 1. SETUP BUFFER ---
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // --- 2. SETUP SHADERS ---
    var vertexShaderCode = document.getElementById("vertexShaderCode").text;
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderCode);
    gl.compileShader(vertexShader);

    // --- FRAGMENT SHADER BARU (TANPA WARNA MERAH/BIRU/HIJAU) ---
    var fragmentShaderCode = `  
        precision mediump float;
        varying vec3 vPosition;
        varying vec3 vColor;    // Kita terima tapi TIDAK KITA PAKAI
        varying vec3 vNormal;
        
        uniform vec3 uAmbientColor;
        uniform float uAmbientIntensity;
        uniform vec3 uDiffuseColor;
        uniform vec3 uDiffusePosition;
        uniform vec3 uViewerPosition;
        
        uniform sampler2D uSampler;

        void main() {
            // Phong Lighting Setup
            vec3 lightPos = uDiffusePosition;
            vec3 vlight = normalize(lightPos - vPosition);
            vec3 normalizedNormal = normalize(vNormal);

            // 1. AMBIENT (Hapus vColor)
            // Kita pakai warna putih dasar agar tekstur kayu terlihat asli
            vec3 ambient = uAmbientColor * uAmbientIntensity;

            // 2. DIFFUSE (Hapus vColor)
            float cosTheta = dot(normalizedNormal, vlight);
            vec3 diffuse = vec3(0., 0., 0.);
            if (cosTheta > 0.) {
                float diffuseIntensity = cosTheta;
                diffuse = uDiffuseColor * diffuseIntensity;
            }
            
            // 3. SPECULAR (Hapus vColor)
            vec3 reflector = reflect(-vlight, normalizedNormal);
            vec3 normalizedReflector = normalize(reflector);
            vec3 normalizedViewer = normalize(uViewerPosition - vPosition);
            float cosPhi = dot(normalizedReflector, normalizedViewer);
            vec3 specular = vec3(0., 0., 0.);
            if (cosPhi > 0.) {
                float shininessConstant = 32.0; 
                float specularIntensity = pow(cosPhi, shininessConstant); 
                specular = uDiffuseColor * specularIntensity;
            }
            
            vec3 lighting = ambient + diffuse + specular;

            // --- 4. TEXTURE BOX MAPPING (Anti-Melar) ---
            vec3 n = abs(normalizedNormal); 
            vec2 uv;

            // Logika: Jika normal menghadap X, pakai YZ. Jika Y, pakai XZ. Jika Z, pakai XY.
            if (n.x > n.y && n.x > n.z) {
                uv = vPosition.yz; // Sisi Samping
            } else if (n.y > n.x && n.y > n.z) {
                uv = vPosition.xz; // Sisi Atas/Bawah
            } else {
                uv = vPosition.xy; // Sisi Depan/Belakang
            }

            // Atur skala tekstur (semakin besar angka, serat makin kecil)
            uv = uv * 1.5; 
            
            vec4 textureColor = texture2D(uSampler, uv);

            // GABUNGKAN: Hanya Cahaya * Tekstur (Tanpa warna vertex merah/biru/hijau)
            gl_FragColor = vec4(lighting, 1.0) * textureColor;
        }
    `;

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderCode);
    gl.compileShader(fragmentShader);    

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // --- 3. ATTRIBUTES ---
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    var aPosition = gl.getAttribLocation(program, "aPosition");
    var aColor = gl.getAttribLocation(program, "aColor");
    var aNormal = gl.getAttribLocation(program, "aNormal");

    var stride = 9 * Float32Array.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, stride, 6 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(aNormal);

    // --- 4. UNIFORMS ---
    gl.viewport(0, 0, canvas.width, canvas.height); 
    gl.enable(gl.DEPTH_TEST);

    var model = glMatrix.mat4.create();
    var view = glMatrix.mat4.create();
    var projection = glMatrix.mat4.create();
    var normalMatrix = glMatrix.mat3.create(); 

    var camera = [0, 0, 4]; 
    glMatrix.mat4.lookAt(view, camera, [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
    
    glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(45), canvas.width / canvas.height, 0.5, 10.0);

    var uModel = gl.getUniformLocation(program, 'uModel');
    var uView = gl.getUniformLocation(program, 'uView');
    var uProjection = gl.getUniformLocation(program, 'uProjection');
    var uNormal = gl.getUniformLocation(program, 'uNormal');

    var uAmbientColor = gl.getUniformLocation(program, 'uAmbientColor');
    gl.uniform3fv(uAmbientColor, [1.0, 1.0, 1.0]); // Ambient PUTIH bersih
    var uAmbientIntensity = gl.getUniformLocation(program, 'uAmbientIntensity');
    gl.uniform1f(uAmbientIntensity, 0.5); // Intensitas sedang
    var uDiffuseColor = gl.getUniformLocation(program, 'uDiffuseColor');
    gl.uniform3fv(uDiffuseColor, [1.0, 1.0, 1.0]);
    var uDiffusePosition = gl.getUniformLocation(program, 'uDiffusePosition');
    gl.uniform3fv(uDiffusePosition, [2.0, 2.0, 5.0]); 
    var uViewerPosition = gl.getUniformLocation(program, "uViewerPosition");
    gl.uniform3fv(uViewerPosition, camera);

    var uSampler = gl.getUniformLocation(program, 'uSampler');
    var texture = loadTexture(gl, 'kayu.jpg'); // Pastikan file kayu.jpg 512x512

    var theta = glMatrix.glMatrix.toRadian(0.5); 

    function render() {
        if(!freeze){
            glMatrix.mat4.rotate(model, model, theta, [1.0, 1.0, 0.5]);
        }
        
        // Ganti background jadi agak terang sedikit biar kontras
        gl.clearColor(0.2, 0.2, 0.2, 1.0); 
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniformMatrix4fv(uModel, false, model);
        gl.uniformMatrix4fv(uView, false, view);
        gl.uniformMatrix4fv(uProjection, false, projection);
        
        glMatrix.mat3.normalFromMat4(normalMatrix, model);
        gl.uniformMatrix3fv(uNormal, false, normalMatrix);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uSampler, 0);

        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 9);
        
        window.requestAnimationFrame(render);
    }
    requestAnimationFrame(render);    
}