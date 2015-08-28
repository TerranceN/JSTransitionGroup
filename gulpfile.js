var gulp = require('gulp'),
    initGulpTasks = require('react-component-gulp-tasks');

var taskConfig = {

	component: {
		name: 'JSTransitionGroup',
	}
};

initGulpTasks(gulp, taskConfig);
