<template>
	<div
    class="loader"></div> 
</template>
<style scoped>
.loader,
.loader:after {
  b-r: 50%;
  width: 5em;
  height: 5em;
}
.loader {
  margin: 60px auto;
  font-size: 10px;
  position: relative;
  text-indent: -9999em;
  border-top: .7em solid rgba(40,167,69, 0.2);
  border-right: .7em solid rgba(40,167,69, 0.2);
  border-bottom: .7em solid rgba(40,167,69, 0.2);
  border-left: .7em solid #28a745;
  -webkit-transform: translateZ(0);
  -ms-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-animation: load8 1.1s infinite linear;
  animation: load8 1.1s infinite linear;
}
@-webkit-keyframes load8 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@keyframes load8 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}


</style>