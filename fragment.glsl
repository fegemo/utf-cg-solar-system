#version 300 es

precision mediump float;
in vec3 v_color;
in vec3 v_normal;
in vec3 v_worldPos;
out vec4 outColor;
uniform float u_alpha;
uniform bool u_showDepth;
uniform bool u_illuminated;

// ajusta o valor de gl_FragCoord.z (não linear) para um valor linearizado entre 0 e 1, baseado nos planos near e far da câmera
// daí conseguimos visualizar melhor o depth buffer
float linearizeDepth(float depth, float near, float far) {
    float linearDepth = (2.0 * near * far) / (far + near - (2.0 * depth - 1.0) * (far - near));
    return clamp(0.0, 1.0, linearDepth / far);
}

vec3 calculateLighting(vec3 normal, vec3 lightPos, vec3 color) {
    // o sol está no centro (0, 0, 0), então o vetor lightDir é 
    // a posição do sol menos a posição do fragmento em espaço de mundo, normalizado
    vec3 lightDir = normalize(lightPos - v_worldPos);
    float diffuseCoefficient = max(dot(normal, lightDir), 0.0);
    vec3 diffuseComponent = color * diffuseCoefficient;

    float ambientCoefficient = 0.3;
    vec3 ambientComponent = color * ambientCoefficient;
    return diffuseComponent + ambientComponent;
}

void main() {
    if (u_showDepth) {
        float near = 1.0; 
        float far = 200.0;
        float nonLinearDepth = gl_FragCoord.z;
        outColor = vec4(vec3(linearizeDepth(nonLinearDepth, near, far)), 1.0);
        return;
    }
    
    if (u_illuminated) {
        vec3 illuminatedColor = calculateLighting(normalize(v_normal), vec3(0.0, 0.0, 0.0), v_color);
        outColor = vec4(illuminatedColor, u_alpha);
        return;
    }

    outColor = vec4(v_color, u_alpha);
}
