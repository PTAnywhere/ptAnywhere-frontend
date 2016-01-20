package uk.ac.open.kmi.forge.ptAnywhere.widget.memorable;

import java.util.List;
import java.util.Random;


public class MemorableNameFactory {

    protected List<String> pool1;
    protected List<String> pool2;

    public MemorableNameFactory(List<String> pool1, List<String> pool2) {
        this.pool1 = pool1;
        this.pool2 = pool2;
    }

    protected String getElement(List<String> pool, String seed) {
        // http://stackoverflow.com/questions/785091/consistency-of-hashcode-on-a-java-string
        return pool.get(Math.abs(seed.hashCode()) % pool.size());
    }

    public String getName(String seed) {
        final int middlePoint = (int) Math.ceil(seed.length()/2.0);  // 8 => 4, 7 => 4
        final String first = seed.substring(0, middlePoint);
        final String second = seed.substring(middlePoint);
        return getElement(this.pool1, first) + " " + getElement(this.pool2, second);
    }

    protected String chooseRandomElement(List<String> pool, Random rnd) {
        return pool.get(rnd.nextInt(pool.size()));
    }

    public String getName() {
        final Random rnd = new Random();
        return chooseRandomElement(this.pool1, rnd) + " " + chooseRandomElement(this.pool2, rnd);
    }
}
