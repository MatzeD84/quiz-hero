import { CONFIG } from './config.js';
import { QuizDataService } from './quiz-data-service.js';
import { QuizState } from './quiz-state.js';
import { QuizView } from './quiz-view.js';
import { QuizController } from './quiz-controller.js';

document.addEventListener('DOMContentLoaded', () => {
    const controller = new QuizController({
        dataService: new QuizDataService({
            questionsUrl: CONFIG.questionsUrl,
            feedbackUrl: CONFIG.feedbackUrl
        }),
        state: new QuizState(),
        view: new QuizView()
    });

    controller.init();
});
