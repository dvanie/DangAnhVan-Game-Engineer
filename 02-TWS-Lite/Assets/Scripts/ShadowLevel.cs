using UnityEngine;

public class ShadowLevel : MonoBehaviour
{
    public int level = 1;

    public int currentExp = 0;

    public int expToNextLevel = 100;
    public int damageBonus = 0;

    public void GainExp(int amount)
    {
        currentExp += amount;

        Debug.Log(
            gameObject.name +
            " gained " +
            amount +
            " EXP"
        );

        while (currentExp >= expToNextLevel)
        {
            currentExp -= expToNextLevel;

            LevelUp();
        }
    }

    private void LevelUp()
    {
        level++;

        damageBonus += 1;

        expToNextLevel += 50;

        Debug.Log(
            gameObject.name +
            " reached Level " +
            level
        );
    }
}