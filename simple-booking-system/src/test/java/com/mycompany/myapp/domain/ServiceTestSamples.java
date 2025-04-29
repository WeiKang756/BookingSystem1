package com.mycompany.myapp.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class ServiceTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static Service getServiceSample1() {
        return new Service().id(1L).name("name1");
    }

    public static Service getServiceSample2() {
        return new Service().id(2L).name("name2");
    }

    public static Service getServiceRandomSampleGenerator() {
        return new Service().id(longCount.incrementAndGet()).name(UUID.randomUUID().toString());
    }
}
