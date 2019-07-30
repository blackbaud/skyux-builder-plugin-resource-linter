class Test {
    constructor(
        blah: ServiceOne,
        testService: SkyAppResourcesService
    ) {}

    public ngOnInit() {
        this.someObservableCall();
        this.testService.getString('test_key');
        this.testService.getString('test_key_with_params', 'a param');
        this.otherService.getString('this_should_not_be_here');
    }
}
