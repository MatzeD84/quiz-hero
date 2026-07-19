import { CONFIG } from './config.js?v=20260705';
import { QuizDataService } from './quiz-data-service.js?v=20260705';
import { QuizState } from './quiz-state.js?v=20260705';
import { QuizView } from './quiz-view.js?v=20260705';
import { QuizController } from './quiz-controller.js?v=20260719';
import { UserService } from './user-service.js?v=20260705';
import { initFooter } from './footer.js?v=20260705';
import { initConsent } from './consent.js?v=20260705';
import { applyAccountHeaderLogo } from './account-logo.js?v=20260719b';

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
