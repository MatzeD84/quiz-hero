import { CONFIG } from './config.js?v=dev';
import { QuizDataService } from './quiz-data-service.js?v=dev';
import { QuizState } from './quiz-state.js?v=dev';
import { QuizView } from './quiz-view.js?v=dev';
import { QuizController } from './quiz-controller.js?v=dev';
import { UserService } from './user-service.js?v=dev';
import { initFooter } from './footer.js?v=dev';
import { initConsent } from './consent.js?v=dev';
import { applyAccountHeaderLogo } from './account-logo.js?v=dev';

document.addEventListener('DOMContentLoaded', () => {
    initConsent();
    initFooter();
    applyAccountHeaderLogo();

    const controller = new QuizController({
        dataService: new QuizDataService({
            questionsUrl: CONFIG.questionsUrl,
            tagsUrl: CONFIG.tagsUrl,
            feedbackUrl: CONFIG.feedbackUrl,
            apiUrl: CONFIG.apiUrl
        }),
        state: new QuizState(),
        view: new QuizView(),
        userService: new UserService()
    });

    controller.init();
});
