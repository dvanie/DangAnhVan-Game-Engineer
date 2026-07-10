using UnityEngine;

public class PlayerLevel : MonoBehaviour
{
    public int level = 1;

    public int currentExp = 0;

    public int expToNextLevel = 100;

    public void GainExp(int amount)
    {
        currentExp += amount;

        Debug.Log(
            "Player gained " +
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

        expToNextLevel += 50;

        Debug.Log(
            "Player reached Level " +
            level
        );
    }
}