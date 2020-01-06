import {
    SkyAppResourcesService,
    SkyLibResourcesService,
    NotResourcesService
} from "./services";


export class Test {
    constructor(
        private otherService: NotResourcesService,
        private testService: SkyAppResourcesService,
        private libService: SkyLibResourcesService
    ) { }

    public ngOnInit() {
        const param1 = 'foo';
        const keyVal = '1';
        let nonStandardKey = `some_key_${keyVal}`;
        // Should not be considered
        this.someObservableCall();
        this.otherService.getString('this_should_not_be_here');

        // App resources service
        this.testService.getString(nonStandardKey);
        this.testService.getString(nonStandardKey, param1);
        this.testService.getString('test_key');
        this.testService.getString('test_key_missing', param1);
        this.testService.getString('test_key_with_params', 'a param');
        this.testService.getString('test_key_with_params', param1);
        this.testService.getString('test_key_with_params_missing', param1);

        // Lib resources service
        this.libService.getString(nonStandardKey);
        this.libService.getString(nonStandardKey, param1);
        this.libService.getString('lib_key');
        this.libService.getString('lib_key_missing');
        this.libService.getString('lib_key_with_params', 'a param');
        this.libService.getString('lib_key_with_params', param1);
        this.libService.getString('lib_key_with_params_missing', param1);
    }

    private someObservableCall() { }
}
