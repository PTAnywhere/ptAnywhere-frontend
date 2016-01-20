package uk.ac.open.kmi.forge.ptAnywhere.widget.memorable;

import java.util.Arrays;
import java.util.List;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;


public class MemorableNameFactoryTest {

    List<String> set1, set2;
    MemorableNameFactory tested;

    @Before
    public void setUp() {
        this.set1 = Arrays.asList("name1", "name2", "name3");
        this.set2 = Arrays.asList("surname1", "surname2", "surname3");
        this.tested = new MemorableNameFactory(this.set1, this.set2);
    }

    @Test
    public void testGetElement() {
        // "helloword".hashCode()%3 == 0
        assertEquals("name1", this.tested.getElement(this.set1, "helloword"));
        assertEquals("name2", this.tested.getElement(this.set1, "hellowore"));
        assertEquals("name3", this.tested.getElement(this.set1, "helloworf"));
        assertEquals("name1", this.tested.getElement(this.set1, "helloworg"));
        assertEquals("surname1", this.tested.getElement(this.set2, "helloword"));
        assertEquals("surname2", this.tested.getElement(this.set2, "hellowore"));
        assertEquals("surname3", this.tested.getElement(this.set2, "helloworf"));
        assertEquals("surname1", this.tested.getElement(this.set2, "helloworg"));
    }

    @Test
    public void testGetName() {
        // "cp.bSP25QBu.".hashCode()%3 == 1
        // "JX2zc_ZqVA--".hashCode()%3 == 2
        assertEquals("name2 surname3", this.tested.getName("cp.bSP25QBu.JX2zc_ZqVA__"));
    }
}
