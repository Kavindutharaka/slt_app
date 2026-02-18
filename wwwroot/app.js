var app = angular.module('quizApp', []);

app.controller('MainCtrl', ['$scope', '$http', '$timeout', '$interval',
function ($scope, $http, $timeout, $interval) {

    // ---------- IMAGE MAP (category name -> filename) ----------
    var imageMap = {
        'EdgeDefend': 'EdgeDefend.png',
        'Kaspersky': 'Kaspersky.png',
        'Hostingcub': 'Hostingcub.png',
        'Akaza Cloud Fusion': 'Akaza Cloud.png',
        'CubKit': 'CubKit.png',
        'Traverse': 'Traverse.png',
        'Zoho Bigin': 'Zoho Bigin.png',
        'OrdeNow': 'OrdeNow.png',
        'Akaza Chat X': 'Akaza Chat X.png',
        'PeoBiz': 'PeoBiz.png',
        'Dataone': 'Dataone.png'
    };

    // ---------- LOCAL STORAGE SETTINGS ----------
    var DEFAULT_QUESTION_COUNT = 5;
    var DEFAULT_TIMER = 10;

    function getStoredInt(key, fallback) {
        var val = localStorage.getItem(key);
        return val !== null ? parseInt(val, 10) : fallback;
    }

    $scope.globalQuestionCount = getStoredInt('slt_questionCount', DEFAULT_QUESTION_COUNT);
    $scope.globalTimer = getStoredInt('slt_timer', DEFAULT_TIMER);

    // ---------- STATE ----------
    $scope.page = 'home';
    $scope.selectedCategory = null;
    $scope.userName = '';
    $scope.userTp = '';
    $scope.showAdmin = false;
    $scope.adminSaved = false;
    $scope.score = 0;
    $scope.currentQIndex = 0;
    $scope.quizQuestions = [];
    $scope.timerSeconds = $scope.globalTimer;
    $scope.timerPercent = 100;
    $scope.selectedAnswer = null;
    $scope.answerRevealed = false;

    var questionTimer = null;

    // ---------- CATEGORIES ----------
    $scope.categories = [
        { category: 'EdgeDefend', image: 'EdgeDefend.png' },
        { category: 'Kaspersky', image: 'Kaspersky.png' },
        { category: 'Hostingcub', image: 'Hostingcub.png' },
        { category: 'Akaza Cloud Fusion', image: 'Akaza Cloud.png' },
        { category: 'CubKit', image: 'CubKit.png' },
        { category: 'Traverse', image: 'Traverse.png' },
        { category: 'Zoho Bigin', image: 'Zoho Bigin.png' },
        { category: 'OrdeNow', image: 'OrdeNow.png' },
        { category: 'Akaza Chat X', image: 'Akaza Chat X.png' },
        { category: 'PeoBiz', image: 'PeoBiz.png' },
        { category: 'Dataone', image: 'Dataone.png' }
    ];

    $scope.getImage = function (catName) {
        return imageMap[catName] || '';
    };

    // ---------- HOME ----------
    $scope.selectCategory = function (cat) {
        $scope.selectedCategory = cat.category;
    };

    $scope.onLogoClick = function ($event) {
        $scope.showAdmin = true;
        $scope.adminSaved = false;
    };

    $scope.closeAdmin = function ($event) {
        $scope.showAdmin = false;
    };

    // ---------- ADMIN (localStorage) ----------
    $scope.incrementGlobalQ = function () {
        if ($scope.globalQuestionCount < 5) $scope.globalQuestionCount++;
    };
    $scope.decrementGlobalQ = function () {
        if ($scope.globalQuestionCount > 1) $scope.globalQuestionCount--;
    };
    $scope.incrementTimer = function () {
        if ($scope.globalTimer < 60) $scope.globalTimer++;
    };
    $scope.decrementTimer = function () {
        if ($scope.globalTimer > 3) $scope.globalTimer--;
    };

    $scope.saveAdminSettings = function () {
        localStorage.setItem('slt_questionCount', $scope.globalQuestionCount);
        localStorage.setItem('slt_timer', $scope.globalTimer);
        $scope.adminSaved = true;
        $timeout(function () { $scope.adminSaved = false; }, 2000);
    };

    // ---------- FORM PAGE ----------
    $scope.goToForm = function () {
        if (!$scope.selectedCategory) return;
        $scope.page = 'form';
    };

    // ---------- START QUIZ ----------
    $scope.startQuiz = function () {
        if (!$scope.userName || !$scope.userTp) return;

        var qCount = $scope.globalQuestionCount;

        $http.get('/api/question/' + encodeURIComponent($scope.selectedCategory))
            .then(function (res) {
                var allQ = angular.isString(res.data) ? JSON.parse(res.data) : res.data;
                $scope.quizQuestions = shuffle(allQ).slice(0, qCount);
                $scope.currentQIndex = 0;
                $scope.score = 0;
                $scope.selectedAnswer = null;
                $scope.answerRevealed = false;
                $scope.page = 'quiz';
                startTimer();
            });
    };

    // ---------- QUIZ LOGIC ----------
    function startTimer() {
        stopTimer();
        $scope.timerSeconds = $scope.globalTimer;
        $scope.timerPercent = 100;
        $scope.selectedAnswer = null;
        $scope.answerRevealed = false;

        questionTimer = $interval(function () {
            $scope.timerSeconds--;
            $scope.timerPercent = ($scope.timerSeconds / $scope.globalTimer) * 100;
            if ($scope.timerSeconds <= 0) {
                revealAndAdvance(null);
            }
        }, 1000);
    }

    function stopTimer() {
        if (questionTimer) {
            $interval.cancel(questionTimer);
            questionTimer = null;
        }
    }

    $scope.selectAnswer = function (key) {
        if ($scope.answerRevealed) return;
        $scope.selectedAnswer = key;
        revealAndAdvance(key);
    };

    function revealAndAdvance(key) {
        stopTimer();
        $scope.answerRevealed = true;

        if (key === $scope.quizQuestions[$scope.currentQIndex].answer) {
            $scope.score++;
        }

        $timeout(function () {
            if ($scope.currentQIndex < $scope.quizQuestions.length - 1) {
                $scope.currentQIndex++;
                startTimer();
            } else {
                showResults();
            }
        }, 1500);
    }

    // ---------- RESULTS ----------
    function showResults() {
        $scope.page = 'result';

        $http.post('/api/score', {
            userName: $scope.userName,
            tp: $scope.userTp,
            category: $scope.selectedCategory,
            score: $scope.score,
            totalQuestions: $scope.quizQuestions.length
        });

        $timeout(function () {
            window.location.reload();
        }, 6000);
    }

    // ---------- UTILS ----------
    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

}]);
