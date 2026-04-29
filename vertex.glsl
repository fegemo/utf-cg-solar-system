#version 300 es

in vec3 a_coords;
in vec3 a_color;
in vec3 a_normal;
out vec3 v_normal;
out vec3 v_color;
out vec3 v_worldPos;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform bool u_usePerVertexColor;
uniform vec3 u_color;

void main() {
    mat3 normalMatrix = transpose(inverse(mat3(u_model)));
    v_normal = normalMatrix * a_normal;
    v_worldPos = (u_model * vec4(a_coords, 1.0)).xyz;
    if (u_usePerVertexColor) {
        v_color = a_color;
    } else {
        v_color = u_color;
    }
    gl_Position = u_projection * u_view * u_model * vec4(a_coords, 1.0);
}
