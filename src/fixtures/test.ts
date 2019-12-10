class Test {
    constructor(
        blah: ServiceOne,
        testService: SkyAppResourcesService,
        libService: SkyLibResourcesService
    ) { }

    public ngOnInit() {
        const param1 = 'foo';
        this.someObservableCall();
        this.testService.getString('test_key');
        this.testService.getString('test_key_with_params', 'a param');
        this.otherService.getString('this_should_not_be_here');
        this.libService.getString('lib_key_ts');
        this.libService.getString('lib_key_ts_with_param', param1);
        this.libService.getString('lib_key_ts_with_param_missing', param1);
    }
}
