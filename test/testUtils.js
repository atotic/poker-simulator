// Simple testing framework
window.addEventListener("error", ev => {
  log(`Unexpected error: ${ev.message}`);
  alert("js error");
});

function error(msg) {
  document.getElementById('error').appendChild(document.createTextNode(msg + "\n"));
  console.trace();
}

function log(msg) {
  document.getElementById('log').appendChild(document.createTextNode(msg + "\n"));
}

function assert_true(t, msg) {
  if (!t)
    error(`${msg}   assertion is false`);
}

function assert_equal(a, b, msg) {
  if (a != b)
    error(`${msg}  ${a} != ${b}`);
}

function initTestDivs() {
  let d = document.createElement('div');
  d.innerHTML = `<pre id="error" style="color:red"></pre>
<pre id="log"></pre>`;
  document.body.appendChild(d);
}